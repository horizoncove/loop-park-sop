> 🗄 **历史方案稿（2026-09-22 多 Agent 方案对比用），已定稿归档，不作现行规则。**
> 现行规则一律以权威 `E:\Obsidian-Vaults\Xloop-KB\Loop-OS\CANON.md`（当前 **V2.7**）为准。
> 本文件仅保留作决策过程的留痕，请勿据此执行归档动作。

# Cursor 方案 · CANON（指针统一，不搬家）

| 项 | 值 |
|---|---|
| 方案 ID | `cursor-canon-v1` |
| 作者 | Cursor（本机工单台对话） |
| 日期 | 2026-09-22 |
| 配对架构 | [方案-Cursor-系统架构-V1.md](./方案-Cursor-系统架构-V1.md) |
| 可执行表 | [CANON.md](./CANON.md) |
| 一句话 | 仓库各留各的；只统一「谁能改」和「用哪个 ID 指过去」。 |

这份是拿去和 WorkBuddy / 豆包 / Codex / MiniMax 方案并列对比的。落地时读 `CANON.md`，不必再搬目录。

---

## 1. 要解决的问题

现在不是缺知识库，是 **同一件事有五六个「正式版」**：

- SOP 桌面仓、E 盘 `looppark`、XLOOP 文档仓、WorkBuddy、三份 Obsidian、Notion、飞书，各写各的
- 文件号冲突：桌面 `35` 是 IP 内容，RAG `35` 是四方 SOP，Obsidian 又占成 `42`
- 六个 Agent 各有本地工作区，升格没有门禁，后改的覆盖先改的
- 已有《多端同步配置手册》规定「先改桌面再复制」，但没有多 Agent 边界

大搬迁（合成一个 vault、把 Agent 家搬进 E 盘）会停工，也解决不了「谁能改」。

---

## 2. 主张

**关联靠稳定 ID，统一靠按类型的唯一可写源。**

- 不合并 Obsidian，不迁 Agent 家，不把 RAG 当 git 主仓
- 每个正式对象一个 `id`（`SOP-物业-03`、`cam-4-roof`、`aerial_parking`）
- 每个类型只承认一个可写路径；其余是 `pointer` / `freeze` / `draft`
- 同步只许单向；禁止 Notion ↔ Obsidian ↔ RAG 互相同步

和「桌面是 Source of Truth」手册兼容：手册管 **SOP md**；本方案把代码、飞书制度、机位表、工单账本也各定一个 Canon。

---

## 3. 三层，不四层

```
┌─────────────────────────────────────────────┐
│  L0  CANON.md     指针表（本方案唯一新增物）   │
└─────────────────────────────────────────────┘
         │ 开场必读
         ▼
┌──────────────┐   升格    ┌──────────────────┐
│ L1 沙箱      │ ───────► │ L2 可写源         │
│ Agent 本地   │          │ 代码仓 / 桌面SOP  │
│ 对话、HTML   │          │ 飞书制度 / 面板   │
└──────────────┘          └────────┬─────────┘
                                   │ 单向复制 / 冻结
                                   ▼
                          ┌──────────────────┐
                          │ L3 派生          │
                          │ RAG / Obsidian   │
                          │ Notion / freeze  │
                          └──────────────────┘
```

新增物只有 `CANON.md` 和各沙箱里 20 行入口。现有文件原地不动。

---

## 4. 可写源怎么划（对比时看这一表）

| 类型 | Canon | 为什么是它 | 不是它 |
|---|---|---|---|
| 代码 | `property_management_saas` + GitHub | 已在跑 188 路机位和 TypeSafe | RAG `code/` 快照、WorkBuddy HTML |
| SOP md | 桌面 `LOOP-PARK-SOP` | 手册已定、已有 git | E 盘第二份 SOP 仓只作镜像 |
| 制度原文 | 飞书「天玑」 | 现场岗在飞书里读 | 本机 md 冲突时退让 |
| 楼层机位 | `buildingFloors.ts` + `cameraPlan.ts` + A00 | 面板和测试已经吃这份 | 手改 RAG CSV |
| 工单账本 | `/ops` | 四方 SOP 已冻：面板是唯一闭环 | 飞书群、对讲、豆包会话 |
| 检索 | `E:\RAG知识库\looppark\` | Agent 已从这里搜 | 不当主仓 |
| 人读 | `D:\Loop\Loop 萝卜 world` | 手册已定的 Vault | 另外两个 vault 只读 |

完整路径见 [CANON.md](./CANON.md)。

---

## 5. 稳定 ID，不用文件号

跨端对齐只认 ID，不认「第几号 md」：

| ID | 对象 |
|---|---|
| `SOP-物业-03` | 四方 SOP（现场人 / 飞书 / 豆包 / 面板） |
| `cam-4-roof` | 4# 屋面超高清星光 |
| `aerial_parking` | 登高面停车 |
| `freeze-2026-09-22` | 当日冻结包 |

副本头：

```yaml
id: SOP-物业-03
canon: <可写源路径>
status: pointer | freeze | draft
as_of: 2026-09-22
```

编号 35 / 42 可以继续各叫各的，只要正文里有同一个 `id`。

---

## 6. Agent 怎么协调

| 规矩 | 做法 |
|---|---|
| 开场 | 读 `E:\RAG知识库\looppark\CANON.md` |
| 草稿 | 留在自己工作区，`status: draft` |
| 升格 | 写入对应 Canon → 跑现有 sync → 需要时打 freeze |
| 冲突 | Canon 的 git 胜；沙箱后改也不覆盖 |
| 豆包 | 参谋；不改 `classId`、不改优先级、不关单 |

各家目录继续用：

- WorkBuddy `E:\workbuddy\Loop Park`
- Codex `~\.codex`
- MiniMax `~\.minimax`
- OpenClaw `~\.openclaw\workspace`
- Cursor 本仓库

不要求搬进同一个 workspace。

---

## 7. 同步（沿用，不新开管道）

```
飞书天玑 ──只读──► Desktop SOP / RAG
Desktop SOP ──复制──► Obsidian / Notion / looppark
GitHub 代码 ──冻结──► Loop-OS/freezes/日期/code
沙箱 ──升格──► Canon
```

继续用已有 `sync-to-notion.py`、`sync-to-feishu.ps1`。Token 只放 `.env`，从手册正文里拿掉。

---

## 8. 最小落地（不做大搬迁）

1. 本目录已放 `CANON.md`（本步已做）。
2. 各 Agent 家放 20 行入口，链到这份文件（未做，等对比后）。
3. 新写正式 SOP 必须带 `id:`；旧文不回头改编号。
4. 下一次升格起：先改 Canon，再复制，不再从 WorkBuddy / 对话直接覆盖 Obsidian。

---

## 9. 明确不做

- 不合并三份 Obsidian
- 不把 Agent 工作区迁到 E 盘
- 不让 RAG 当代码主仓
- 不日常全量镜像源码（只打 freeze）
- 不双向同步
- 不把 Notion Token 再写进 md

---

## 10. 给对比会用的维度

评其他方案时用同一组问题：

1. **搬家量**：要不要迁目录 / 并 vault？本方案：零。
2. **可写源是否按类型拆开**：代码、SOP、飞书、账本是否各有一个主人？
3. **跨端对齐靠什么**：文件号、路径，还是稳定 ID？
4. **多 Agent 冲突怎么判**：时间戳、群里喊一声，还是 Canon git？
5. **和现有手册 / sync 脚本是否兼容**：本方案沿用，不新开管道。
6. **密钥**：方案正文里有没有明文 Token？
7. **现场闭环**：工单账本是否仍只在 `/ops`？

---

## 11. 风险

| 风险 | 怎么收 |
|---|---|
| 没人读 `CANON.md` | 入口只有 20 行；对比通过后才铺 |
| 桌面 SOP 与 E 盘 SOP 仓继续双写 | E 盘那份降为镜像，不再直接 commit 新文 |
| 飞书与桌面 drift | 制度冲突以飞书为准；桌面只保留 Agent 工作稿 |
| 编号习惯难改 | 允许旧号并存，只要求新文带 `id` |
