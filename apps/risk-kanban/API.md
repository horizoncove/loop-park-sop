# 看板数据与外部 API

完整接口、鉴权与 curl 见 [`../loop-kanban-api/API.md`](../loop-kanban-api/API.md)。

**真相源：** Postgres `events` ← `apps/loop-kanban-api` ← `/loop-kanban/api`。

浏览器看板点选席位换 Bearer 会话（无口令）；其它系统用 `API_KEY`。`localStorage` 只是缓存。
