# LOOP PARK SOP 飞书知识库批量同步脚本
# ---------------------------------------------------------------------------
# 2026-09-22 19:55 重大修正 —— 此前 19:35 的「修复」是误判，已回滚
#
#    误判经过：用 bot 身份访问 7687220978920737762 得到 131006「无权限」、
#    访问 KEB1wZ.../EaJewX... 得到 131005「not found」，据此判定
#    「spaceId 错了、父节点失效」，并把它们改掉、另建同步区。
#
#    真相（登录 user 身份后才看得到）：
#      * 7687220978920737762 = 知识库「Loop Park」，本来就是正确目标
#      * KEB1wZcRIixC9KkEqa9cc2XVnMe = 「工作SOP」   —— 有效，且已同步过 35-IP内容创作SOP
#      * EaJewX7PAisUTXkxHSdc5gA9nyd = 「舆情监测体系」—— 有效
#      * 报错的真正原因是 bot 未被授权访问该空间，不是 ID 错误。
#
#    教训（已写入 CANON 易错点表）：
#      「权限报错」不等于「ID 失效」。判定 ID 失效前，必须换有权限的身份复验，
#      否则会把一条原本正确的配置改成错的。
#
#    本版改动：
#      1) spaceId 回滚为 7687220978920737762（Loop Park）
#      2) 父节点回滚为 KEB1wZ... / EaJewX...
#      3) 身份 bot -> user（该空间为 public wiki space，bot 加不进成员、
#         且 tenant 缺 read 权限，实测 131006；user 端到端实测通过）
#      4) 天玑库内误建的「SOP-DESK 同步区」已删除
# ---------------------------------------------------------------------------
# 2026-09-22 20:05 修正
#      a) 第 111 行「# 主流程」与 Write-Log 挤在同一行，导致整句被注释、
#         函数缺闭合括号 -> 脚本根本无法运行（0 篇同步）。已加回换行。
#      b) 文件改为 UTF-8 with BOM（PowerShell 5.1 按 GBK 读无 BOM 的 UTF-8，
#         中文注释会全部乱码）。
#      c) 先生已删除同名重复库，现只剩一个「天玑」（B12 结项）。
#      d) 增加成功/失败计数与结尾汇总，便于核验。
# ---------------------------------------------------------------------------
# 2026-09-22 20:25 首轮全量同步后修复（33 篇：30 成功 / 3 失败）
#      e) --content 改为 "@<文件路径>"：正文直接作命令行参数时，
#         以 "---"（YAML frontmatter）开头的 md 会被当成 flag 报
#         "bad flag syntax: ---"，导致整篇写入失败。@file 方式可绕过。
#      f) node-list 补 --page-all：默认只返回第一页，曾漏掉同名节点，
#         导致 35-IP内容创作SOP 被重复创建（已删除重复的第二个）。
#      g) auth status 不加 --format json（该子命令不支持此 flag，
#         加了会返回 ok:false 的 error JSON，身份自检误判为未就绪）。
#      h) 所有 lark-cli 调用用 2>&1 而非 2>$null：PowerShell 把 lark-cli
#         的输出全部归到 stderr，用 2>$null 会把 JSON 一起丢掉。
# ---------------------------------------------------------------------------
# 飞书现有知识库一览（user 身份可见 3 个）：
#   7687220978920737762  Loop Park        <- 本脚本目标：工作SOP / 舆情监测体系
#   7618137437004385239  天玑              <- 10 个根节点(01-项目总览...10-知识库管理)
#   7478942466440331265  示例知识库 / Wiki samples
# ---------------------------------------------------------------------------

$spaceId = "7687220978920737762"   # 知识库「Loop Park」

$sopParentNode    = "KEB1wZcRIixC9KkEqa9cc2XVnMe"   # Loop Park / 工作SOP
$yuqingParentNode = "EaJewX7PAisUTXkxHSdc5gA9nyd"   # Loop Park / 舆情监测体系

$identity = "user"   # 该空间 bot 无权（131006），必须用 user

$repoRoot  = "C:\Users\Administrator\Desktop\LOOP-PARK-SOP"
$workDir   = "$repoRoot\工作SOP"
$yuqingDir = "$repoRoot\舆情监测"
$logFile   = "$repoRoot\sync-log.txt"

# --content @file 只接受「当前目录内的相对路径」，绝对路径会被 CLI 拒绝：
#   "--content: invalid file path ... --file must be a relative path within the
#    current directory"。故必须先切到仓库根，再把绝对路径换算成相对路径。
Set-Location $repoRoot

$script:okCount  = 0
$script:failList = @()

# ---- 防误挂保险：父节点未填直接退出 ----
if ([string]::IsNullOrWhiteSpace($sopParentNode) -or [string]::IsNullOrWhiteSpace($yuqingParentNode)) {
    Write-Host "[X] 拒绝运行：父节点 token 未填写。" -ForegroundColor Red
    exit 1
}

# ---- JSON 安全解析：lark-cli 的 stdout 会混入 node.exe 等非 JSON 噪音 ----
#     实测：auth status --format json 输出首行是 "node.exe..."，直接 ConvertFrom-Json 会抛
#     "无效的 JSON 基元"，导致脚本在中途崩溃。统一从第一个 '{' 开始截取。
function ConvertFrom-JsonSafe {
    param($raw)
    if (-not $raw) { return $null }
    $s = [string]$raw
    $i = $s.IndexOf('{')
    if ($i -lt 0) { return $null }
    try { return ($s.Substring($i) | ConvertFrom-Json) } catch { return $null }
}

# ---- 身份自检：user token 是否仍有效（2 小时过期，7 天内可 refresh）----
$authRaw = lark-cli auth status 2>&1 | Out-String
$authStatus = ConvertFrom-JsonSafe $authRaw
if (-not $authStatus -or $authStatus.identities.user.status -ne "ready") {
    Write-Host "[X] 拒绝运行：user 身份未就绪（token 可能已过期）。" -ForegroundColor Red
    Write-Host "    请先执行： lark-cli auth login --domain wiki --domain docs" -ForegroundColor Yellow
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
    # --page-all 必须加：默认只返回第一页，漏掉同名节点会导致重复新建（本次已实证：35 变成两个）
    $existRaw = lark-cli wiki +node-list --space-id $spaceId --parent-node-token $parentNodeToken --as $identity --format json --page-all 2>&1 | Out-String
    $match = $null
    $existing = ConvertFrom-JsonSafe $existRaw
    # 🔴 字段名必须是 data.nodes（不是 data.items）。写错时每次都匹配不到同名节点，
    #    于是每跑一次就全量重建一遍 —— 2026-09-22 第二次运行即因此多出 32 个空节点。
    if ($existing -and $existing.ok -and $existing.data) {
        $match = $existing.data.nodes | Where-Object { $_.title -eq $title } | Select-Object -First 1
    }

    if ($match) {
        Write-Log "[$category] 已存在同名节点，复用: $title"
        $objToken = $match.obj_token
    } else {
        # Step 1: 创建节点
        try {
            $createRaw = lark-cli wiki +node-create --space-id $spaceId --parent-node-token $parentNodeToken --title $title --obj-type docx --as $identity --format json 2>&1 | Out-String
            $createJson = ConvertFrom-JsonSafe $createRaw

            if (-not $createJson -or -not $createJson.ok) {
                Write-Log "[$category] 创建节点失败: $title - $($createJson.error.message)"
                $script:failList += "$category/$title (create: $($createJson.error.message))"
                return
            }

            $objToken = $createJson.data.obj_token
            Write-Log "[$category] 节点创建成功: $title, obj_token: $objToken"
        }
        catch {
            Write-Log "[$category] 创建节点异常: $title - $_"
            $script:failList += "$category/$title (create exception)"
            return
        }
        Start-Sleep -Seconds 2
    }

    # Step 2: 填充内容（overwrite = 幂等重跑不会产生重复）
    #   ⚠️ 必须用 "--content @<相对路径>"：
    #      a) 正文直接作命令行参数时，以 "---"（YAML frontmatter）开头的 md
    #         会被当成 flag，报 "bad flag syntax: ---"（00-CANON写作公约 实证）。
    #      b) @ 后必须是「当前目录内的相对路径」，绝对路径会被 CLI 拒绝
    #        （"--file must be a relative path within the current directory"）。
    $relPath = $filePath.Substring($repoRoot.Length + 1) -replace '\\','/'
    try {
        $updateRaw = lark-cli docs +update --doc $objToken --command overwrite --doc-format markdown --content "@$relPath" --as $identity --format json 2>&1 | Out-String
        $updateJson = ConvertFrom-JsonSafe $updateRaw

        if ($updateJson -and $updateJson.ok) {
            Write-Log "[$category] 同步成功: $title"
            $script:okCount++
        } else {
            Write-Log "[$category] 内容填充失败: $title - $($updateJson.error.message)"
            $script:failList += "$category/$title (update: $($updateJson.error.message))"
        }
    }
    catch {
        Write-Log "[$category] 内容填充异常: $title - $_"
        $script:failList += "$category/$title (update exception)"
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
Write-Log "成功 $script:okCount 篇，失败 $($script:failList.Count) 篇"
if ($script:failList.Count -gt 0) {
    Write-Log "失败明细："
    foreach ($f in $script:failList) { Write-Log "  - $f" }
}
