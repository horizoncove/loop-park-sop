# 部署到 zhidaoflow.cn `/loop-kanban/`

静态页 + 独立 Postgres API。**不要动**现有 `/app` SaaS。云端不 ssh；本机 scp / `docker compose`。

- 看板 URL：https://zhidaoflow.cn/loop-kanban/
- 静态目录：`/www/wwwroot/zhidaoflow.cn/loop-kanban/`
- API：`https://zhidaoflow.cn/loop-kanban/api/` → `127.0.0.1:3010`
- DB：容器 `loop-kanban-db`，库/用户 `loop_kanban`，宿主机 `127.0.0.1:5433`

## 1. 静态页

仓库根目录：

```bash
npm run build:zhidao
```

即 `STATIC_EXPORT=1 BASE_PATH=/loop-kanban NEXT_PUBLIC_API_BASE=/loop-kanban/api`。产物 `apps/risk-kanban/out/`。

```bash
rsync -av --delete apps/risk-kanban/out/ user@host:/www/wwwroot/zhidaoflow.cn/loop-kanban/
```

不要套一层 `out/` 目录，不要覆盖 `/www/wwwroot/zhidaoflow.cn/app/`。

本地开发不要设 `BASE_PATH`：

```bash
npm run dev                 # http://localhost:3000，纯 localStorage
# 连本机 API：
NEXT_PUBLIC_API_BASE=http://127.0.0.1:3010/api npm run dev
```

## 2. API + Postgres

在能访问服务器的机器上，先装依赖并构建：

```bash
npm install --prefix apps/loop-kanban-api
npm run build --prefix apps/loop-kanban-api
```

把 compose 与 API 源码放到 `/opt/loop-kanban`（若 DB 已在该目录起来，只同步 `api/` 再 `up api`）：

```bash
rsync -av deploy/loop-kanban/ user@host:/opt/loop-kanban/
rsync -av --delete --exclude node_modules --exclude dist apps/loop-kanban-api/ user@host:/opt/loop-kanban/api/
```

服务器上：

```bash
cd /opt/loop-kanban
cp -n .env.example .env   # 已有 .env 则跳过
# 编辑 .env：POSTGRES_PASSWORD 与 DATABASE_URL 必须一致
# DATABASE_URL=postgres://loop_kanban:<密码>@host.docker.internal:5433/loop_kanban

export LOOP_KANBAN_API_CONTEXT=./api
docker compose up -d --build          # 仅 api，连已有 5433 上的 loop-kanban-db
# 若还没有库：
# docker compose --profile full up -d --build
```

空表时 API 启动会写入 30 条种子。也可用 `deploy/loop-kanban/schema.sql` + `seed.sql` 做 initdb。

验收：

```bash
curl -sS http://127.0.0.1:3010/api/health
curl -sS http://127.0.0.1:3010/api/events | head
```

## 3. Nginx

把 `deploy/loop-kanban/nginx-loop-kanban.conf.snippet` 放进站点 conf，**写在 SPA fallback 之前**：

```nginx
location ^~ /loop-kanban/api/ {
    proxy_pass http://127.0.0.1:3010/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location ^~ /loop-kanban/ {
    alias /www/wwwroot/zhidaoflow.cn/loop-kanban/;
    index index.html;
}
```

`nginx -t && nginx -s reload`。

## 4. 验收

- https://zhidaoflow.cn/loop-kanban/ 四列灯性看板，资源 `/loop-kanban/_next/`
- https://zhidaoflow.cn/loop-kanban/api/health → `{"ok":true,"db":true}`
- 拖动事件后刷新（或换浏览器）仍在，数据在 Postgres
- `/loop-kanban/seats/`、`/gates/`、`/risk/?id=D-01`

## 5. 数据

- 源：Postgres `events`（API 为真相源）
- 浏览器 `localStorage` 键 `loop-park-risk-kanban-v3` 仅作离线缓存
- 顶栏「重置种子」→ `POST /loop-kanban/api/events/reset`
