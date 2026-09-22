# LOOP PARK SOP 飞书知识库批量同步脚本
# ---------------------------------------------------------------------------
# 🔴 2026-09-22 19:55 重大修正 —— 此前 19:35 的「修复」是误判，已回滚
#
#    误判经过：用 bot 身份访问 7687220978920737762 得到 131006「无权限」、
#    访问 KEB1wZ…/EaJewX… 得到 131005「not found」，我据此判定
#    「spaceId 错了、父节点失效」，并把它们改掉、另建同步区。
#
#    真相（登录 user 身份后才看得到）：
#      · 7687220978920737762 = 知识库「Loop Park」，**本来就是正确目标**
#      · KEB1wZcRIixC9KkEqa9cc2XVnMe = 「工作SOP」   —— **有效，且已同步过 35-IP内容创作SOP**
#      · EaJewX7PAisUTXkxHSdc5gA9nyd = 「舆情监测体系」—— **有效**
#      · 报错的真正原因是 **bot 未被授权访问该空间**，不是 ID 错误。
#
#    教训（已写入 CANON 易错点表）：
#      「权限报错」≠「ID 失效」。判定 ID 失效前，必须换有权限的身份复验，
#      否则会把一条原本正确的配置改成错的。
#
#    本版改动：
#      1) spaceId 回滚为 7687220978920737762（Loop Park）
#      2) 父节点回滚为 KEB1wZ… / EaJewX…
#      3) 身份 bot → **user**（该空间为 public wiki space，bot 加不进成员、
#         且 tenant 缺 read 权限，实测 131006；user 端到端实测通过）
#      4) 天玑库内误建的「SOP-DESK 同步区」已删除
# ---------------------------------------------------------------------------
# ⚠️ 飞书现有知识库一览（user 身份可见 4 个，**两个同名「天玑」，勿混**）：
#   7618137437004385239  天玑        ← 10 个根节点(01-项目总览…10-知识库管理)
#   7618139086410271683  天玑        ← 长安与唐人街品牌方案专用（同名！易混）
#   7687220978920737762  Loop Park   ← ★本脚本目标：工作SOP / 舆情监测体系
#   7478942466440331265  示例知识库 / Wiki samples
# ---------------------------------------------------------------------------

$spaceId = "7687220978920737762"   # 知识库「Loop Park」

$sopParentNode    = "KEB1wZcRIixC9KkEqa9cc2XVnMe"   # Loop Park / 工作SOP
$yuqingParentNode = "EaJewX7PAisUTXkxHSdc5gA9nyd"   # Loop Park / 舆情监测体系

$identity = "user"   # 该空间 bot 无权（131006），必须用 user

$workDir   = "C:\Users\Administrator\Desktop\LOOP-PARK-SOP\工作SOP"
$yuqingDir = "C:\Users\Administrator\Desktop\LOOP-PARK-SOP\舆情监测"
$logFile   = "C:\Users\Administrator\Desktop\LOOP-PARK-SOP\sync-log.txt"

# ---- 防误挂保险：父节点未填直接退出 ----
if ([string]::IsNullOrWhiteSpace($sopParentNode) -or [string]::IsNullOrWhiteSpace($yuqingParentNode)) {
    Write-Host "❌ 拒绝运行：父节点 token 未填写。" -ForegroundColor Red
    exit 1
}

# ---- 身份自检：user token 是否仍有效（2 小时过期，7 天内可 refresh）----
$authStatus = lark-cli auth status --format json 2>&1 | Out-String | ConvertFrom-Json
if ($authStatus.identities.user.status -ne "ready") {
    Write-Host "❌ 拒绝运行：user 身份未就绪（token 可能已过期）。" -ForegroundColor Red
    Write-Host "   请先执行： lark-cli auth login --domain wiki --domain docs" -ForegroundColor Yellow
    exit 1
}

function Write-Log {
    param($msg)
    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$time - $msg" | Out-File -Append -FilePath $logFile -Encoding UTF8
    Write-Host "$time - $msg"
}

function Sync-Document {
    param(
        $fileName,
        $filePath,
        $parentNodeToken,
        $category
    )

    $title = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
    Write-Log "[$category] 开始同步: $title"

    # Step 0: 幂等检查 —— 同名节点已存在则跳过新建，直接复用其 obj_token
    $existing = lark-cli wiki +node-list --space-id $spaceId --parent-node-token $parentNodeToken --as $identity --format json 2>&1 | Out-String | ConvertFrom-Json
    $match = $null
    if ($existing.ok -and $existing.data) {
        $match = $existing.data.items | Where-Object { $_.title -eq $title } | Select-Object -First 1
    }

    if ($match) {
        Write-Log "[$category] 已存在同名节点，复用: $title"
        $objToken = $match.obj_token
    } else {
        # Step 1: 创建节点
        try {
            $createResult = lark-cli wiki +node-create --space-id $spaceId --parent-node-token $parentNodeToken --title $title --obj-type docx --as $identity --format json 2>&1 | Out-String
            $createJson = $createResult | ConvertFrom-Json

            if (-not $createJson.ok) {
                Write-Log "[$category] 创建节点失败: $title - $($createJson.error.message)"
                return
            }

            $objToken = $createJson.data.obj_token
            Write-Log "[$category] 节点创建成功: $title, obj_token: $objToken"
        }
        catch {
            Write-Log "[$category] 创建节点异常: $title - $_"
            return
        }
        Start-Sleep -Seconds 2
    }

    # Step 2: 填充内容（overwrite = 幂等重跑不会产生重复）
    try {
        $content = Get-Content $filePath -Raw -Encoding UTF8
        $updateResult = lark-cli docs +update --doc $objToken --command overwrite --doc-format markdown --content $content --as $identity --format json 2>&1 | Out-String
        $updateJson = $updateResult | ConvertFrom-Json

        if ($updateJson.ok) {
            Write-Log "[$category] 同步成功: $title"
        } else {
            Write-Log "[$category] 内容填充失败: $title - $($updateJson.error.message)"
        }
    }
    catch {
        Write-Log "[$category] 内容填充异常: $title - $_"
    }

    Start-Sleep -Seconds 3
}

# 主流程
Write-Log "========== 开始批量同步（space=Loop Park $spaceId, identity=$identity） =========="

Write-Log "开始同步工作SOP..."
$sopFiles = Get-ChildItem $workDir -Filter "*.md" | Sort-Object Name
foreach ($file in $sopFiles) {
    Sync-Document -fileName $file.Name -filePath $file.FullName -parentNodeToken $sopParentNode -category "工作SOP"
}
Write-Log "工作SOP同步完成，共 $($sopFiles.Count) 篇"

Write-Log "开始同步舆情监测..."
$yuqingFiles = Get-ChildItem $yuqingDir -Filter "*.md" | Sort-Object Name
foreach ($file in $yuqingFiles) {
    Sync-Document -fileName $file.Name -filePath $file.FullName -parentNodeToken $yuqingParentNode -category "舆情监测"
}
Write-Log "舆情监测同步完成，共 $($yuqingFiles.Count) 篇"

Write-Log "========== 全部同步完成 =========="
