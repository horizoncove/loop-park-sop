import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import {
  authConfig,
  corsOrigins,
  isSeat,
  readIdentity,
  readsNeedAuth,
  sessionTtlSeconds,
  signSession,
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
import { suggestEventFields, typesafeConfigured } from "./typesafe.js";

/** Load local .env without committing secrets. Docker/compose env still wins. */
function loadDotEnv() {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const text = readFileSync(join(dir, "../.env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined || process.env[key] === "") {
        process.env[key] = value;
      }
    }
  } catch {
    // optional
  }
}

loadDotEnv();

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
app.use("/api/suggest", requireAuth);

app.get("/api/health", async (c) => {
  try {
    await pool.query("SELECT 1");
    return c.json({
      ok: true,
      db: true,
      auth: writesNeedAuth(),
      typesafe: typesafeConfigured(),
    });
  } catch (error) {
    return c.json({ ok: false, db: false, error: String(error) }, 503);
  }
});

app.get("/api/auth/config", (c) =>
  c.json({
    ...authConfig(),
    typesafeSuggest: typesafeConfigured(),
  }),
);

app.post("/api/auth/login", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { seat?: unknown } | null;
  const seat = typeof body?.seat === "string" ? body.seat.trim() : "";
  if (!isSeat(seat)) return c.json({ error: "请选择八将席位" }, 400);
  const token = signSession(seat);
  const ttl = sessionTtlSeconds();
  return c.json({
    token,
    tokenType: "Bearer",
    seat,
    admin: seat === "正将",
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

app.post("/api/suggest", async (c) => {
  if (!typesafeConfigured()) {
    return c.json({ error: "未配置 TYPESAFE_API_KEY", enabled: false }, 503);
  }
  const body = (await c.req.json().catch(() => null)) as {
    title?: unknown;
    description?: unknown;
  } | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description : "";
  if (!title) return c.json({ error: "请先填写标题" }, 400);
  try {
    const suggestion = await suggestEventFields({ title, description });
    return c.json(suggestion);
  } catch (error) {
    console.error("typesafe suggest failed", error);
    return c.json({ error: "智能建议暂时不可用", detail: String(error) }, 502);
  }
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
        console.warn("auth disabled: set API_KEY / REQUIRE_AUTH=1 for production");
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
