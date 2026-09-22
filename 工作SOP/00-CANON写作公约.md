---
id: LP-OPS-CANON-WRITE-0001
title: 新 SOP 写作公约
status: active
canon: E:\Obsidian-Vaults\Xloop-KB\Loop-OS\CANON.md
canon_version: V2.9
as_of: 2026-09-22
---

# 新 SOP 写作公约

> ⚠️ **2026-09-22 17:20 修正**：本文件原写「定稿 SoT 是 Xloop-KB」「升格进 Xloop-KB」，
> 那是**上午旧拍板，已被先生 16:41 裁决推翻**。按 CANON V2.9：**运营 SOP 定稿就在本桌面仓，不升格。**
> 权威规则以 `E:\Obsidian-Vaults\Xloop-KB\Loop-OS\CANON.md`（**当前 V2.9**）为准，本文件只是本仓的写作细则。

## 一、正文写哪（双 SoT，先生已裁决）

- **运营 SOP 类 md** → **本目录** `C:\Users\Administrator\Desktop\LOOP-PARK-SOP\工作SOP\`
  → 仓 `horizoncove/loop-park-sop`。**定稿即在此，不升格进 Xloop-KB，不在 Obsidian 另存第二正式版。**
- **内容 / 战略类 md**（战略、口径、总纲、宣传、造星）→ `E:\Obsidian-Vaults\Xloop-KB`
  → 仓 `horizoncove/xloop-obsidian-kb`。**这类才进 Xloop-KB。**

## 二、新文件必须带

```yaml
id: SOP-… 或 LP-[领域]-[主题]-[序号]
canon: C:\Users\Administrator\Desktop\LOOP-PARK-SOP\工作SOP\<文件名>
status: draft   # 定稿后改 active / freeze
as_of: YYYY-MM-DD
```

## 三、写完正文不算定稿落地，还要三步

1. **立刻 `git commit`**（CANON 规矩 9）—— 不 commit 被并发覆盖就是真丢。
2. **当天在 `E:\Obsidian-Vaults\Xloop-KB\Loop-OS\REGISTRY.md` 的 SOP-DESK 指针区追加一行**：
   只写指针、**不搬正文**，`sot` 列必须写 `SOP-DESK`。
   **指针滞后 = 该 SOP 在联邦里视为不存在。** REGISTRY 属主是 workbuddy，其他人投 `90-Inbox\_conflicts\`。
3. **当日 freeze 覆盖双端**：`Xloop-KB\Loop-OS\freezes\YYYY-MM-DD\` 下加 `sop-desk\` 快照。

## 四、其余规矩

- 跨端对齐**只用 `id`**，不用「第几号」（历史上「35 号」就是这么分裂的）。旧文不回头改编号。
- 现场岗要看 → **单向**发飞书「天玑」；飞书不是写源，不回写。
- 外发学习包 = **MD + PDF + 公网链接** 三件套，只丢 git 路径不算交付。
- **不要把正文再抄一份进 Obsidian / Notion / RAG / `D:\Loop`** —— 那些是镜像或只读归档。
- 密钥不写进正文。
