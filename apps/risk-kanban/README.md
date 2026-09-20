# LOOP 事件看板

LOOP PARK 红线闸运营台 MVP。中文界面。事件按灯性分级，千门八将分列八席。

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

- 默认看板：**按灯性**（红灯阻断 / 黄灯观察 / 绿灯闭环 / 灰灯待分级）。拖动事件改灯性。
- 也可切 **按席位**（八将）或 **按状态**（待排查 → 关闭）
- 「只看我的席」+ 席位选择（默认反将，记在本机）
- `/seats` 八席仪表盘
- `/gates` 九条红线，标注执法席
- `/sop` 周节奏与开业里程碑
- 无登录、无外部 DB

## 八将职责

| 席 | 职责 |
|----|------|
| 正将 | 拍板；超货盘 · 价外 · 9# 闸 |
| 提将 | 母表、Brief、挂周入库 |
| 风将 | 情报 / 客流竞品 / 舆情 / 高校日历报知 |
| 谣将 | 口径、公域危机话术、禁语 |
| 反将 | Scout → 邀约 → 养成 / A 池 |
| 火将 | 物业安全 / 消防通道 / 开业条件否决 |
| 脱将 | 租户经营 / 交铺商管 / 市集动线 |
| 除将 | 钱合同、保单押金、未批不上账 |

## 数据

- 种子与运行时：`data/risks.json`（version 3，含 `collabSeats`）
- API：`GET/PUT /api/risks`，`GET/PATCH /api/risks/[id]`
- 浏览器备份：`localStorage` 键 `loop-park-risk-kanban-v3`
- 顶栏「重置种子」会同时清本地与 JSON
