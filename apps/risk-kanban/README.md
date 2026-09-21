# LOOP 事件看板

LOOP PARK 红线闸运营台 MVP。中文界面。事件按灯性分级，千门八将分列八席。

## 启动

```bash
npm i
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。不要设置 `BASE_PATH`。

子路径构建（zhidaoflow.cn `/loop-kanban/`）见 [DEPLOY-zhidaoflow.md](./DEPLOY-zhidaoflow.md)。

```bash
npm run build
npm start
```

## 能力

- 默认看板：**按灯性**（红灯阻断 / 黄灯观察 / 绿灯闭环 / 灰灯待分级）。拖动事件改灯性。
- 也可切 **按席位**（八将）或 **按状态**（待排查 → 关闭）
- 「只看我的席」；生产点选八将进入（无口令），只分角色显示
- 新建事件「智能建议」：经 API 调 TypeSafe（Jev）预填分类 / 等级 / 席位 / 灯性（密钥只在服务端）
- `/seats` 八席仪表盘
- `/gates` 九条红线，标注执法席
- `/sop` 周节奏与开业里程碑
- 生产数据在 Postgres（`/loop-kanban/api`）；本地无 API 时 localStorage

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

- 生产：Postgres `events`，经 `NEXT_PUBLIC_API_BASE=/loop-kanban/api`（席位会话或 `API_KEY`）
- 浏览器缓存：`localStorage` 键 `loop-park-risk-kanban-v3`
- 外部系统怎么调：[`../loop-kanban-api/API.md`](../loop-kanban-api/API.md)
- 部署：[`DEPLOY-zhidaoflow.md`](./DEPLOY-zhidaoflow.md)
