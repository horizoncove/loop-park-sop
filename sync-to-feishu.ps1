# LOOP PARK SOP 飞书知识库批量同步脚本
# 工作SOP父节点: KEB1wZcRIixC9KkEqa9cc2XVnMe
# 舆情监测父节点: EaJewX7PAisUTXkxHSdc5gA9nyd

$spaceId = "7687220978920737762"
$sopParentNode = "KEB1wZcRIixC9KkEqa9cc2XVnMe"
$yuqingParentNode = "EaJewX7PAisUTXkxHSdc5gA9nyd"

$workDir = "C:\Users\Administrator\Desktop\LOOP-PARK-SOP\工作SOP"
$yuqingDir = "C:\Users\Administrator\Desktop\LOOP-PARK-SOP\舆情监测"

$logFile = "C:\Users\Administrator\Desktop\LOOP-PARK-SOP\sync-log.txt"

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
        $createResult = lark-cli wiki +node-create --space-id $spaceId --parent-node-token $parentNodeToken --title $title --obj-type docx --as user --format json 2>&1 | Out-String
        $createJson = $createResult | ConvertFrom-Json

        if (-not $createJson.ok) {
            Write-Log "[$category] 创建节点失败: $title - $($createJson.error.message)"
            return
        }

        $objToken = $createJson.data.obj_token
        $nodeToken = $createJson.data.node_token
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

        # 写入飞书
        $updateResult = lark-cli docs +update --doc $objToken --command overwrite --doc-format markdown --content $content --as user --format json 2>&1 | Out-String
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
Write-Log "========== 开始批量同步 =========="

# 同步工作SOP
Write-Log "开始同步工作SOP..."
$sopFiles = Get-ChildItem $workDir -Filter "*.md" | Sort-Object Name
foreach ($file in $sopFiles) {
    Sync-Document -fileName $file.Name -filePath $file.FullName -parentNodeToken $sopParentNode -category "工作SOP"
}
Write-Log "工作SOP同步完成，共 $($sopFiles.Count) 篇"

# 同步舆情监测
Write-Log "开始同步舆情监测..."
$yuqingFiles = Get-ChildItem $yuqingDir -Filter "*.md" | Sort-Object Name
foreach ($file in $yuqingFiles) {
    Sync-Document -fileName $file.Name -filePath $file.FullName -parentNodeToken $yuqingParentNode -category "舆情监测"
}
Write-Log "舆情监测同步完成，共 $($yuqingFiles.Count) 篇"

Write-Log "========== 全部同步完成 =========="
