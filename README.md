# LOOP PARK SOP + 风险看板

本仓库同时包含：

- `工作SOP/`、`舆情监测/`：既有中文 SOP 文档（保持不动）
- `apps/risk-kanban/`：**LOOP 风险看板** MVP（看板 + 交通灯 + 红线闸）

## 风险看板（本地 / 云端均可）

无需登录、无需外部数据库、无需 Vercel 鉴权。首次加载会写入种子风险清单。

```bash
npm i
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

| 路径 | 说明 |
|------|------|
| `/` | 五列看板，可筛选、可拖拽 |
| `/risk/[id]` | 详情编辑、红线闸、备注、状态移动 |
| `/gates` | 九条全局红线闸仪表盘 |
| `/sop` | 每周 / 开业里程碑清单 |

持久化：浏览器 `localStorage` + `apps/risk-kanban/data/risks.json`（经 `/api/risks` 读写）。

生产构建：

```bash
npm run build
npm start
```

也可进入应用目录单独安装：

```bash
cd apps/risk-kanban
npm i
npm run dev
```

## SOP 文档

- [工作SOP](./工作SOP/README.md)
- [舆情监测](./舆情监测/README.md)
