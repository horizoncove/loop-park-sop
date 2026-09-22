#!/usr/bin/env bash
# LOOP PARK SOP -> 飞书知识库「Loop Park」批量同步脚本（Git Bash 版）
# ---------------------------------------------------------------------------
# ⛔ 为什么用 bash 而不是 PowerShell：
#    PowerShell 5.1 捕获 native 命令输出时会把 UTF-8 中文读成 GBK 乱码，
#    导致 ConvertFrom-Json 解析失败（报“传入的对象无效”），幂等检查因此永远
#    匹配不到同名节点 —— 每跑一次就全量重建一遍空节点。
#    2026-09-22 实测：PowerShell 版连跑三次，节点从 27 涨到 68，全是空壳。
#    Git Bash 下 UTF-8 正常，幂等可正常工作。
# ---------------------------------------------------------------------------
# 目标：知识库「Loop Park」space_id=7687220978920737762
#        ├ 工作SOP      parent=KEB1wZcRIixC9KkEqa9cc2XVnMe
#        └ 舆情监测体系  parent=EaJewX7PAisUTXkxHSdc5gA9nyd
#   该空间为 public wiki space，bot 加不进成员、tenant 缺 read（131006），
#   **必须用 --as user**。user token 2 小时过期，7 天内可 refresh：
#     lark-cli auth login --domain wiki --domain docs
# ---------------------------------------------------------------------------
set -uo pipefail

REPO="C:/Users/Administrator/Desktop/LOOP-PARK-SOP"
SPACE="7687220978920737762"
SOP_PARENT="KEB1wZcRIixC9KkEqa9cc2XVnMe"
YQ_PARENT="EaJewX7PAisUTXkxHSdc5gA9nyd"
IDENTITY="user"
LOG="$REPO/sync-log.txt"
MAP="$REPO/.sync-map.tsv"   # 幂等键：文件名 -> obj_token（不依赖飞书侧标题）

ok=0; failed=0; created=0; reused=0
FAILLIST=()

# --content @file 只接受「当前目录内的相对路径」，故必须 cd 到仓库根
cd "$REPO" || { echo "❌ 仓库目录不存在"; exit 1; }

# 身份自检
if ! lark-cli auth status 2>/dev/null | grep -q '"status": "ready"'; then
  echo "❌ user 身份未就绪，请先： lark-cli auth login --domain wiki --domain docs"
  exit 1
fi

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG"; }

# 取某个父节点下全部 (node_token, obj_token, title)，全局缓存避免重复请求
declare -A NODE_OBJ NODE_TITLE
load_nodes() {
  local parent="$1"
  lark-cli wiki +node-list --space-id "$SPACE" --parent-node-token "$parent" \
      --as "$IDENTITY" --page-all --format json 2>/dev/null \
    | grep -E '"(node_token|obj_token|title)"' \
    | sed -E 's/^[[:space:]]*"(node_token|obj_token|title)": "//; s/",?$//' \
    | paste - - - \
    | while IFS=$'\t' read -r nt ot ti; do
        echo "$ti|$ot|$nt"
      done
}

sync_one() {
  local file="$1" parent="$2" category="$3"
  local base rel title
  base="$(basename "$file")"
  rel="${file#$REPO/}"
  title="${base%.md}"

  # 🔴 幂等键：优先用本地映射表 .sync-map.tsv（文件名 -> obj_token）
#    为什么不用标题匹配：飞书 wiki 节点的 title 会被文档 H1/Fronmatter title
#    自动改写（实证：README.md 的 H1 是「LOOP PARK 知识库管理 SOP 体系」，
#    写入后节点标题就变成了它，导致按文件名再也匹配不到 -> 下次又新建一个）。
#    映射表不依赖飞书侧标题，是唯一可靠的幂等键。
  local obj=""
  if [ -f "$MAP" ]; then
    obj=$(awk -F'\t' -v k="$rel" '$1==k {print $2; exit}' "$MAP")
  fi
  if [ -z "$obj" ]; then
    while IFS='|' read -r ti ot nt; do
      [ "$ti" = "$title" ] && { obj="$ot"; break; }
    done <<< "$NODES_CACHE"
  fi

  if [ -n "$obj" ]; then
    reused=$((reused+1))
    log "[$category] 复用同名节点: $title"
  else
    local res
    res=$(lark-cli wiki +node-create --space-id "$SPACE" --parent-node-token "$parent" \
            --title "$title" --obj-type docx --as "$IDENTITY" --format json 2>/dev/null)
    obj=$(echo "$res" | grep -oE '"obj_token": "[A-Za-z0-9]+"' | head -1 | sed 's/.*: "//;s/"//')
    if [ -z "$obj" ]; then
      failed=$((failed+1)); FAILLIST+=("$category/$title (create)")
      log "[$category] 创建节点失败: $title"
      return
    fi
    created=$((created+1))
    echo -e "$rel\t$obj" >> "$MAP"
    log "[$category] 节点创建成功: $title (已记入映射表)"
    sleep 2
  fi

  local ures
  ures=$(lark-cli docs +update --doc "$obj" --command overwrite --doc-format markdown \
           --content "@$rel" --as "$IDENTITY" --format json 2>/dev/null)
  if echo "$ures" | grep -q '"ok": true'; then
    ok=$((ok+1)); log "[$category] 同步成功: $title"
  else
    failed=$((failed+1)); FAILLIST+=("$category/$title (update)")
    log "[$category] 内容填充失败: $title - $(echo "$ures" | grep -oE '"message": "[^"]*"' | head -1)"
  fi
  sleep 2
}

log "========== 开始同步（space=Loop Park $SPACE, identity=$IDENTITY） =========="

NODES_CACHE="$(load_nodes "$SOP_PARENT")"$'\n'"$(load_nodes "$YQ_PARENT")"

log "--- 工作SOP ---"
while IFS= read -r f; do sync_one "$f" "$SOP_PARENT" "工作SOP"; done < <(find "$REPO/工作SOP" -maxdepth 1 -name '*.md' | sort)

log "--- 舆情监测 ---"
while IFS= read -r f; do sync_one "$f" "$YQ_PARENT" "舆情监测"; done < <(find "$REPO/舆情监测" -maxdepth 1 -name '*.md' | sort)

log "========== 完成：成功 $ok / 失败 $failed（新建 $created，复用 $reused） =========="
if [ ${#FAILLIST[@]} -gt 0 ]; then
  log "失败明细："
  for x in "${FAILLIST[@]}"; do log "  - $x"; done
fi
