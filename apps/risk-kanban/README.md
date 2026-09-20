# LOOP 风险看板

LOOP PARK 红线闸运营台 MVP。中文界面，五列看板，交通灯卡片。

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

- 列：待排查 → 排查中 → 黄灯观察 → 红灯阻断 → 已关闭/绿
- 拖拽改列并持久化（`@dnd-kit`）
- 筛选：分类 / 席位 / 等级 / 灯色 / 关键词
- 首次加载种子风险（D-01 消防通道、交铺保单、自营网咖、公域条件红等）
- `/gates` 九条红线总览
- `/sop` 周节奏与开业里程碑（勾选存本机）
- 无登录、无外部 DB

## 数据

- 种子与运行时：`data/risks.json`
- API：`GET/PUT /api/risks`，`GET/PATCH /api/risks/[id]`
- 浏览器备份：`localStorage` 键 `loop-park-risk-kanban-v1`
- 顶栏「重置种子」会同时清本地与 JSON

## 栈

Next.js App Router · TypeScript · Tailwind CSS v4 · `@dnd-kit`
