# LOOP PARK SOP 飞书知识库批量同步脚本
# ---------------------------------------------------------------------------
# 2026-09-22 19:35 修正（依据 CANON V2.12，来源 lark-cli 实测，非推测）：
#   1) spaceId 原为 7687220978920737762 → 实测 131006 无权限；
#      天玑真身 = 7618137437004385239（wiki +space-list 只返回这 1 个空间）
#   2) 原父节点 token（KEB1wZcRIixC9KkEqa9cc2XVnMe / EaJewX7PAisUTXkxHSdc5gA9nyd）
#      实测 131005 not found，已失效 → 置空，必须重填后才允许运行
#   3) 身份已定为 bot-only（先生拍板）→ --as user 全部改 --as bot
# ---------------------------------------------------------------------------
# 2026-09-22 19:40 追加（先生提议「新建一个知识库」后实测）：
#   ⛔ 新建整个 wiki space 走不通：+space-create 帮助明确写
#      "Only --as user is supported; the create API does not accept a tenant/bot token"
#      而当前 user_identity = missing。故 bot-only 下只能【在天玑内新建专属节点区】。
#   ✅ 已建专属容器（天玑 → SOP-DESK 同步区 → 工作SOP / 舆情监测），不占用任何业务节点：
#      SOP-DESK 同步区（自动写入） JJ3EwMrqjiKOAykWKxWc1ocAnMc
#      └ 工作SOP                   MgbJwkEwSi3x9AkhKJmcDuttnQf
#      └ 舆情监测                  TBH2wJ7RwiHtLbkaqzWcreLunlf
# ---------------------------------------------------------------------------
# ⚠️ 天玑现有根节点（如需改挂业务节点，从这里选）：
#   01-项目总览      QIekw3gOhizDVckjeeacyGp7nCf
#   02-造星计划      IOghwxuIriVLUZky1gWckilanRh
#   03-三大联赛      BlcUwWgDmiGjQIkUNa2cJ0CRnPf
#   04-五大主线活动  PCraw9sMRie1HgkRLR1cHj0vnUc
#   05-自营业态      CUYgwbYXmix8RKkNQg9cFBqXnWc
#   06-组织与人才    HAeNwRdGLi28rAkF51DcS4rnngc
#   07-招商与商户    QB6nw4ebkioCYKkuLXocp4AfnKf
#   08-财务与投资    IK7PwhlWviLvp0kq2a3cksCMnfb
#   09-市场与推广    Hgxvw4zFPi5aOckd6k7cPAbPnAf
#   10-知识库管理    WZF4wHH1qihPH1k0O5zcX3W4nre
# ---------------------------------------------------------------------------

$spaceId = "7618137437004385239"

# ↓↓↓ 已填：专属同步区（留空则脚本拒绝运行，绝不默认挂业务节点）
$sopParentNode    = "MgbJwkEwSi3x9AkhKJmcDuttnQf"   # SOP-DESK 同步区 / 工作SOP
$yuqingParentNode = "TBH2wJ7RwiHtLbkaqzWcreLunlf"   # SOP-DESK 同步区 / 舆情监测

$workDir   = "C:\Users\Administrator\Desktop\LOOP-PARK-SOP\工作SOP"
$yuqingDir = "C:\Users\Administrator\Desktop\LOOP-PARK-SOP\舆情监测"
$logFile   = "C:\Users\Administrator\Desktop\LOOP-PARK-SOP\sync-log.txt"

# ---- 防误挂保险：父节点未填直接退出 ----
if ([string]::IsNullOrWhiteSpace($sopParentNode) -or [string]::IsNullOrWhiteSpace($yuqingParentNode)) {
    Write-Host "❌ 拒绝运行：父节点 token 未填写。" -ForegroundColor Red
    Write-Host "   请先从脚本顶部「天玑现有根节点」中选一个，填进 `$sopParentNode / `$yuqingParentNode。" -ForegroundColor Yellow
    Write-Host "   原因：原父节点实测 131005 not found；脚本不会擅自挂到任何业务节点下。" -ForegroundColor Yellow
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

    # Step 1: 创建节点
    try {
        $createResult = lark-cli wiki +node-create --space-id $spaceId --parent-node-token $parentNodeToken --title $title --obj-type docx --as bot --format json 2>&1 | Out-String
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

    # Step 2: 填充内容
    try {
        $content = Get-Content $filePath -Raw -Encoding UTF8
        $updateResult = lark-cli docs +update --doc $objToken --command overwrite --doc-format markdown --content $content --as bot --format json 2>&1 | Out-String
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
Write-Log "========== 开始批量同步（space=天玑 7618137437004385239, identity=bot） =========="

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
