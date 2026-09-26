# 59 · 多 Agent 协作总纲 SOP（三层约束与任务闭环）

> **版本**：V1.0（2026-09-26）
> **属主**：workbuddy（小知）　**批准**：先生（2026-09-26 拍板「1+3」）
> **关联**：CANON V2.18 / KB-LEDGER / OWNERS / AGENT-BOOTSTRAP / AGENT-TASKBOARD
> **定位**：全联邦 Agent 的协作元规则——不规定「干什么活」，只规定「怎么一起干活」

---

## 1. 目的与边界

多个 Agent（workbuddy / codex / minimax / qclaw / deepseek-harness 等）并行工作，历史已实证两次撞车与重复劳动。本 SOP 定**协作元规则**：管住三样东西——**口径、流程、状态**。人不盯着谁在干嘛，让机制盯。

- **管**：任务认领、口径引用、产出登记、冲突裁决、验收冻结。
- **不管**：各 Agent 的内部技术实现、各自模型的选择、具体业务内容（业务内容归各业务 SOP）。

## 2. 三层约束（每个 Agent 每次开工都要穿过）

| 层 | 唯一事实源 | 铁律 |
|---|---|---|
| **① 口径层** | `E:\Obsidian-Vaults\Xloop-KB\Loop-OS\CANON.md`（当前 V2.18） | 全员只认这一份，**禁止自带口径**；桌面与 `.kb-contract` 下同名文件均为指针 |
| **② 流程层** | 桌面 `LOOP-PARK-SOP` 编号体系（当前至 59） | 干活只走已有 SOP；没有对应 SOP 才允许新建编号，**禁止另起炉灶平行体系** |
| **③ 状态层** | `~\.kb-contract\` 三件套：`AGENT-TASKBOARD`（在干）/ `KB-LEDGER`（干完）/ `_conflicts\`（撞车） | append-only；先查后干；认领即登记 |

## 3. 任务生命周期（五步闭环）

```
① 查板认领 → ② 按 SOP 干活 → ③ 干完记 LEDGER → ④ 先生验收 → ⑤ 冻结入库
      ↓（板被占）
   停手 · 投 _conflicts\ · 由先生裁决
```

1. **查板认领**：开工前必读 `AGENT-TASKBOARD.md`；无同类任务在身才开工；开工即追加一行 `claim`（含时间/Agent/任务域/一句话描述/发起来源）。
2. **按 SOP 干活**：引用对应 SOP 编号干活；口径数字一律回 CANON 与真实数据源（数据铁律：绝不编造）。
3. **干完记 LEDGER**：追加一行（时间/Agent/域/动作/内容/备注），并 `git commit`（规矩 9：防并发覆盖）。
4. **先生验收**：向先生交付时给结论与文件路径，标注「依据 SOP-xx / CANON V2.18」。
5. **冻结入库**：定稿级产出按 `xloop-kb-freeze` 流程登记 REGISTRY（SOP 类按规矩 8 在 SOP-DESK 区回流指针，不搬正文）。

## 4. 撞车处理

- **预防**：TASKBOARD 是唯一协调面，看板不看人。
- **发现撞车**（活已被别的 Agent 干了或在干）：立即停手，产出与结论投 `~\.kb-contract\_conflicts\<日期>-<Agent>-<主题>.md`，并在 TASKBOARD 追加一行 `conflict` 登记。
- **裁决**：只有先生裁决；裁决结果由胜出方回写 LEDGER，落选方产出归档不删除。

## 5. 人工决策位（只留三个，多余即修机制）

| 决策位 | 内容 | 形式 |
|---|---|---|
| 选题四选一 | SOP 58 阶段④，企微卡片回复编号 | 每天 ≤1 次 |
| B 级终审 | SOP 57/58，B 级素材任何情况不跳人审 | 企微一键过/驳 |
| 橙/红舆情拍板 | SOP 09，分级响应指挥 | 电话+企微双通道 |

**判据**：若先生开始需要「每天看各 Agent 在干嘛」，说明机制漏了——修机制，不加大人工。超 24h 未拍板按各 SOP 自带降级规则处理（不催第二次）。

## 6. 各 Agent 加载位登记（2026-09-26 实测铺设）

| Agent | 自动加载位 | 指针状态 |
|---|---|---|
| codex | `~\.codex\AGENTS.md` | ✅ 已铺 |
| cursor | `~\.cursor\CANON-ENTRY.md`（经 rules\canon.mdc 加载） | ✅ 已铺 |
| minimax（openclaw 壳） | `~\.openclaw\workspace\AGENTS.md` | ✅ 已铺 |
| qclaw | `~\.qclaw\workspace\AGENTS.md` | ✅ 已铺 |
| deepseek-harness | Electron 壳，**无规则文件注入位** | ⚠️ 无自动加载；开场第一条消息贴本 SOP §2-§3，或由先生在其系统提示中粘贴指针块 |
| 豆包 | `D:\Doubao\CANON-ENTRY.md`（开场入口，9/22 已铺 CANON；参谋定位，草稿投 Xloop-KB\90-Inbox\doubao\） | ✅ 已铺（2026-09-26 先生查漏后补齐） |
| workbuddy | 本工作区记忆 + 契约层 | ✅ 原生执行 |

**新 Agent 上机流程**：找到其指令加载位 → 追加 §7 指针块 → 在本表登记一行 → LEDGER 记账。

## 7. 通用指针块（铺位用，原样粘贴）

```markdown
## 任务观察板（全员必读）

**开工前必查、认领即追加、完工再追加**：`C:\Users\Administrator\.kb-contract\AGENT-TASKBOARD.md`（append-only，禁止改他人历史行）。
- **撞车** → 立即停手，产出投 `~\.kb-contract\_conflicts\`，由先生裁决
- **口径** → 只认 CANON V2.18（`E:\Obsidian-Vaults\Xloop-KB\Loop-OS\CANON.md`），禁止自带口径
- **流程** → 干活只走 SOP 编号体系（桌面 `LOOP-PARK-SOP`）；内容/舆情方向必查 57/58/09/59，禁止另起炉灶
- **完工** → 记 `~\.kb-contract\KB-LEDGER.md` + git commit
- **人工只留三个决策位**：选题四选一 · B 级终审 · 橙/红舆情拍板，其余交给机制
详见 SOP 59《多 Agent 协作总纲》。
```

## 8. 红线汇总

1. TASKBOARD/LEDGER/OWNERS 一律 append-only，历史行神圣不可改。
2. 权威文件改完立刻 git commit（规矩 9），未 commit 的丢失视为真丢。
3. 涉数字/价格/行情必须真实数据源，查不到就明说查不到。
4. 规矩冲突时优先级：CANON > 业务 SOP > 本总纲 > 各 Agent 本地习惯。
5. 本 SOP 自身修订：属主 workbuddy，先生批准后升版号并 LEDGER 记账。

---

*审核卡点：B 级及以上产出按 SOP 57 终审；本总纲与冲突裁决记录按月抽查一次（归属：先生）。*
