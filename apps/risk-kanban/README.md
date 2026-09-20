# LOOP 风险看板

LOOP PARK 红线闸运营台 MVP。中文界面。千门八将按现网合为六席。

## 启动

```bash
npm i
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

```bash
npm run build
npm start
```

## 能力

- 看板切换：**按状态**（待排查 → 排查中 → 黄灯观察 → 红灯阻断 → 已关闭/绿）或 **按席位**（正将 / 提将 / 风谣 / 反将 / 火脱 / 除将）
- 「只看我的席」+ 席位选择（默认反将，记在本机）
- 拖拽改状态，或在按席位视图拖拽改主责席
- `/seats` 六席仪表盘（红/黄/待排查/阻断 + 在办 P0）
- `/gates` 九条红线，标注执法席
- `/sop` 周节奏与开业里程碑
- 无登录、无外部 DB

## 六席职责

| 席 | 职责 |
|----|------|
| 正将 | 拍板；超货盘 · 价外 · 9# 闸 |
| 提将 | 母表、Brief、挂周入库 |
| 风谣 | 情报 + 口径发行（禁语/公域红）；别名风将/谣将 |
| 反将 | Scout → 邀约 → 养成 / A 池 |
| 火脱 | 看场动线、开业条件、消防通道；别名火将/脱将 |
| 除将 | 钱合同、保单押金、未批不上账 |

## 数据

- 种子与运行时：`data/risks.json`（version 2，含 `collabSeats`）
- API：`GET/PUT /api/risks`，`GET/PATCH /api/risks/[id]`
- 浏览器备份：`localStorage` 键 `loop-park-risk-kanban-v2`
- 顶栏「重置种子」会同时清本地与 JSON
