import { serve } from "@hono/node-server";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
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

const port = Number(process.env.PORT ?? 3010);
const pool = createPool();

const app = new Hono();
app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/api/health", async (c) => {
  try {
    await pool.query("SELECT 1");
    return c.json({ ok: true, db: true });
  } catch (error) {
    return c.json({ ok: false, db: false, error: String(error) }, 503);
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

async function writeOne(c: Context) {
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
