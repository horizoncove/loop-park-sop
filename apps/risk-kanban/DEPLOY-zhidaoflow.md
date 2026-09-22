# 部署到 zhidaoflow.cn `/loop-kanban/`

静态页 + Postgres API + **八将点选进入（无口令）**。**不要动**现有 `/app` SaaS。云端不 ssh。

- 看板：https://zhidaoflow.cn/loop-kanban/
- 静态目录：`/www/wwwroot/zhidaoflow.cn/loop-kanban/`
- API：`https://zhidaoflow.cn/loop-kanban/api/` → `127.0.0.1:3010`
- DB：`loop-kanban-db`，库/用户 `loop_kanban`，`127.0.0.1:5433`
- 外部调用说明：[`../loop-kanban-api/API.md`](../loop-kanban-api/API.md)

## 数据流

1. 浏览器点选席位 → `POST /loop-kanban/api/auth/login` `{ "seat" }` → 会话放进 `sessionStorage`
2. 看板读写 → `GET/PUT /loop-kanban/api/events*` + `Authorization: Bearer <会话>`
3. API → Postgres `events`（真相源）
4. `localStorage` 仅缓存；API 可用时以库为准
5. 其它系统用 `API_KEY`（`Authorization: Bearer` 或 `X-API-Key`）调同一套接口

席位选择只用来分角色显示，**没有密码**。

## 1. 静态页

```bash
npm run build:zhidao
rsync -av --delete apps/risk-kanban/out/ user@host:/www/wwwroot/zhidaoflow.cn/loop-kanban/
```

`build:zhidao` 仍是 `STATIC_EXPORT=1 BASE_PATH=/loop-kanban NEXT_PUBLIC_API_BASE=/loop-kanban/api`。

本地：

```bash
npm run dev                 # 无 API：不过选席门，localStorage
NEXT_PUBLIC_API_BASE=http://127.0.0.1:3010/api npm run dev
```

## 2. API + Postgres

```bash
npm install --prefix apps/loop-kanban-api
npm run build --prefix apps/loop-kanban-api

rsync -av deploy/loop-kanban/ user@host:/opt/loop-kanban/
rsync -av --delete --exclude node_modules --exclude dist apps/loop-kanban-api/ user@host:/opt/loop-kanban/api/
```

```bash
cd /opt/loop-kanban
cp -n .env.example .env
# 必改：DATABASE_URL、API_KEY、SESSION_SECRET
# REQUIRE_AUTH=1 时读接口也要令牌（看板选席后会带会话）
# CORS_ORIGINS=https://zhidaoflow.cn

export LOOP_KANBAN_API_CONTEXT=./api
docker compose up -d --build
```

空表会写入 30 条种子。

```bash
curl -sS http://127.0.0.1:3010/api/health
curl -sS -X POST http://127.0.0.1:3010/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"seat":"反将"}'
```

## 3. Nginx

`deploy/loop-kanban/nginx-loop-kanban.conf.snippet`，放在 SPA fallback **之前**：

```nginx
location ^~ /loop-kanban/api/ {
    proxy_pass http://127.0.0.1:3010/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location ^~ /loop-kanban/ {
    alias /www/wwwroot/zhidaoflow.cn/loop-kanban/;
    index index.html;
}
```

## 4. 验收

- 打开 `/loop-kanban/` 点选席位即可进四列灯性看板，无口令框
- 顶栏显示当前席 + 退出；本席卡片浅色块提示
- `GET /loop-kanban/api/health` 无需登录
- 其它系统：见 API.md curl（用 `API_KEY`）

## 5. 环境变量摘要

| 变量 | 作用 |
|------|------|
| `DATABASE_URL` | Postgres |
| `API_KEY` | 机器读写 |
| `SESSION_SECRET` | 席位会话 HMAC |
| `REQUIRE_AUTH` | `1` = 读也要令牌 |
| `CORS_ORIGINS` | 跨域来源，逗号分隔 |
