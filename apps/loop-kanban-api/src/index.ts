import { serve } from "@hono/node-server";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import {
  authConfig,
  corsOrigins,
  readIdentity,
  readsNeedAuth,
  sessionTtlSeconds,
  signSession,
  verifySeatPassword,
  writesNeedAuth,
  type Identity,
} from "./auth.js";
import {
  createPool,
  ensureSchema,
  getEvent,
  listEvents,
  resetEvents,
  seedIfEmpty,
  upsertEvent,
  replaceEvents,
} from "./db.js";
import { eventFromBody, eventsFromBody, patchEvent } from "./map.js";

type Env = { Variables: { identity: Identity | null } };

const port = Number(process.env.PORT ?? 3010);
const pool = createPool();
const app = new Hono<Env>();

const origins = corsOrigins();
app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (origins.includes("*") || origins.length === 0) return origin || "*";
      if (origin && origins.includes(origin)) return origin;
      return origins[0] ?? "*";
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    exposeHeaders: ["Content-Type"],
    maxAge: 86400,
  }),
);

app.use("/api/*", async (c, next) => {
  c.set("identity", readIdentity(c));
  await next();
});

function isWrite(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method);
}

function isResetPath(path: string) {
  return path === "/api/events/reset" || path.endsWith("/events/reset");
}

async function requireAuth(c: Context<Env>, next: () => Promise<void>) {
  if (c.req.method === "OPTIONS") return next();
  const identity = c.get("identity");
  const write = isWrite(c.req.method);
  const needed = write ? writesNeedAuth() : readsNeedAuth();
  if (needed && !identity) {
    return c.json({ error: "未登录或缺少 API Key" }, 401);
  }
  if (isResetPath(c.req.path) && writesNeedAuth() && !identity?.admin) {
    return c.json({ error: "重置种子需要正将会话或 API Key" }, 403);
  }
  await next();
}

app.use("/api/events", requireAuth);
app.use("/api/events/*", requireAuth);

app.get("/api/health", async (c) => {
  try {
    await pool.query("SELECT 1");
    return c.json({ ok: true, db: true, auth: writesNeedAuth() });
  } catch (error) {
    return c.json({ ok: false, db: false, error: String(error) }, 503);
  }
});

app.get("/api/auth/config", (c) => c.json(authConfig()));

app.post("/api/auth/login", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { seat?: unknown; password?: unknown } | null;
  const seat = typeof body?.seat === "string" ? body.seat.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const matched = verifySeatPassword(seat, password);
  if (!matched) return c.json({ error: "席位或口令不对" }, 401);
  const token = signSession(matched);
  const ttl = sessionTtlSeconds();
  return c.json({
    token,
    tokenType: "Bearer",
    seat: matched,
    admin: matched === "正将",
    expiresIn: ttl,
  });
});

app.get("/api/me", (c) => {
  const identity = c.get("identity");
  if (!identity) return c.json({ error: "未登录" }, 401);
  return c.json({
    seat: identity.seat,
    kind: identity.kind,
    admin: identity.admin,
  });
});

app.get("/api/events", async (c) => {
  const events = await listEvents(pool);
  const updatedAt = events.reduce((latest, event) => (event.updatedAt > latest ? event.updatedAt : latest), "");
  return c.json({ events, risks: events, updatedAt: updatedAt || new Date().toISOString() });
});

app.post("/api/events/reset", async (c) => {
  const events = await resetEvents(pool);
  return c.json({ events, risks: events, updatedAt: new Date().toISOString() });
});

function paramId(c: Context) {
  const id = c.req.param("id");
  return decodeURIComponent(id ?? "");
}

app.get("/api/events/:id", async (c) => {
  const id = paramId(c);
  const event = await getEvent(pool, id);
  if (!event) return c.json({ error: "未找到该事件" }, 404);
  return c.json(event);
});

app.put("/api/events", async (c) => {
  const body: unknown = await c.req.json();
  const events = eventsFromBody(body);
  if (!events) return c.json({ error: "events 必须是数组" }, 400);
  const saved = await replaceEvents(pool, events);
  return c.json({ events: saved, risks: saved, updatedAt: new Date().toISOString() });
});

async function writeOne(c: Context<Env>) {
  const id = paramId(c);
  const body: unknown = await c.req.json();
  const current = await getEvent(pool, id);
  const incoming = current ? patchEvent(current, body) : eventFromBody(body, id);
  if (!incoming) return c.json({ error: "无效事件" }, 400);
  incoming.id = id;
  incoming.updatedAt = new Date().toISOString();
  const saved = await upsertEvent(pool, incoming);
  return c.json(saved);
}

app.put("/api/events/:id", (c) => writeOne(c));
app.patch("/api/events/:id", (c) => writeOne(c));

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "服务器错误", detail: String(error) }, 500);
});

async function boot() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await ensureSchema(pool);
      const seeded = await seedIfEmpty(pool);
      if (seeded > 0) console.log(`seeded ${seeded} events`);
      const cfg = authConfig();
      if (!cfg.writesNeedAuth) {
        console.warn("auth disabled: set SEAT_PASSWORDS_JSON / API_KEY / REQUIRE_AUTH=1 for production");
      }
      return;
    } catch (error) {
      console.error(`database not ready (${attempt}/30)`, error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("无法连接数据库（DATABASE_URL）");
}

await boot();
serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`loop-kanban-api http://${info.address}:${info.port}`);
});
