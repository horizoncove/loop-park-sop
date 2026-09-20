# LOOP 事件看板 API

MVP：**席位口令登录**（不是完整账号体系）。八将各有一条口令，存在 API 环境变量里。机器调用用 `API_KEY`。

## 数据从哪来

```
浏览器看板  --Bearer 席位会话-->  https://zhidaoflow.cn/loop-kanban/api/*
其它系统    --Bearer API_KEY / X-API-Key-->  同上
                    │
                    ▼
            apps/loop-kanban-api (Hono :3010)
                    │
                    ▼
            Postgres `events`  （真相源）
```

静态页在 `/loop-kanban/`。`NEXT_PUBLIC_API_BASE=/loop-kanban/api`。

浏览器 `localStorage`（键 `loop-park-risk-kanban-v3`）只在 API 失败时当缓存。有 API base 时，列表以 Postgres 为准。

Nginx：`/loop-kanban/api/` → `127.0.0.1:3010/api/`。

## 鉴权

| 调用方 | 怎么带令牌 | 能力 |
|--------|------------|------|
| 看板登录 | `POST /api/auth/login` 换会话，之后 `Authorization: Bearer <session>` | 读/写；`正将` 可重置种子 |
| 其它系统 | `Authorization: Bearer <API_KEY>` 或 `X-API-Key: <API_KEY>` | 读/写 + 重置（admin） |

环境变量（见 `deploy/loop-kanban/.env.example`）：

- `DATABASE_URL`（必填）
- `SEAT_PASSWORDS_JSON` 八将口令 JSON
- `API_KEY` 机器密钥
- `SESSION_SECRET` 签发席位 JWT-like HMAC
- `REQUIRE_AUTH=1` 读接口也要令牌（生产打开）
- `CORS_ORIGINS` 逗号分隔；看板与 API 同域时浏览器 CORS 不生效，此项给跨域的第三方页

未配置口令 / API_KEY 且 `REQUIRE_AUTH` 不为 `1` 时，接口保持开放（仅本地开发）。

`POST /api/events/reset` 在鉴权开启后只允许 **正将会话** 或 **API_KEY**。

## 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 探活，无需令牌 |
| GET | `/api/auth/config` | 是否需要登录、席位列表 |
| POST | `/api/auth/login` | `{ "seat":"反将","password":"…" }` → `{ token, seat, admin, expiresIn }` |
| GET | `/api/me` | 当前身份 |
| GET | `/api/events` | 列表 `{ events, updatedAt }`（也带 `risks` 兼容） |
| GET | `/api/events/:id` | 单条 |
| PUT | `/api/events` | 整表 upsert，body `{ "events": [ … ] }`，数组顺序即看板顺序 |
| PUT/PATCH | `/api/events/:id` | 更新/创建一条 |
| POST | `/api/events/reset` | 恢复种子 |

JSON 字段与看板一致（camelCase）：`id, title, description, category, severity, light, status, ownerSeat, collabSeats, triggers, residualRisk, redLineGates, notes, updatedAt`。

`status` 用 `todo | investigating | watch | blocked | closed`（库内写成 待排查/排查中/…）。`light` 为 红/黄/绿/灰。`ownerSeat` 为正将…除将 之一。

## 其它系统：curl

把 `KEY` 换成 `.env` 里的 `API_KEY`。线上把 host 换成 `https://zhidaoflow.cn/loop-kanban/api`。

```bash
# 探活
curl -sS http://127.0.0.1:3010/api/health

# 拉全表
curl -sS http://127.0.0.1:3010/api/events \
  -H "Authorization: Bearer $KEY"

# 拉一条
curl -sS http://127.0.0.1:3010/api/events/D-01 \
  -H "X-API-Key: $KEY"

# 改灯性
curl -sS -X PATCH http://127.0.0.1:3010/api/events/D-01 \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"light":"灰"}'

# 整表写入（覆盖顺序）
curl -sS -X PUT http://127.0.0.1:3010/api/events \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"events":[{"id":"X-01","title":"外部写入","description":"…","category":"组织协作","severity":"P2","light":"灰","status":"todo","ownerSeat":"反将","collabSeats":[],"triggers":[],"residualRisk":"","redLineGates":[],"notes":[],"updatedAt":"2026-09-20T08:00:00.000Z"}]}'
```

席位登录（看板自己用，外部一般用 API_KEY）：

```bash
curl -sS -X POST http://127.0.0.1:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"seat":"反将","password":"change-me-fan"}'
```
