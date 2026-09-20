import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { eventFromBody, type EventJson, type EventRow, rowToEvent, statusToDb } from "./map.js";
import { SCHEMA_SQL } from "./schema.js";

const { Pool } = pg;

const here = path.dirname(fileURLToPath(import.meta.url));

export function loadSeedEvents(): EventJson[] {
  const candidates = [
    path.resolve(here, "../data/seed.json"),
    path.resolve(here, "../../data/seed.json"),
    path.resolve(process.cwd(), "data/seed.json"),
  ];
  for (const file of candidates) {
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as { risks?: unknown[]; events?: unknown[] };
      const list = parsed.risks ?? parsed.events ?? [];
      return list
        .map((item) => eventFromBody(item))
        .filter((item): item is EventJson => Boolean(item));
    } catch {
      // try next
    }
  }
  throw new Error("找不到 data/seed.json");
}

export function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("缺少 DATABASE_URL");
  }
  return new Pool({
    connectionString: url,
    max: 8,
  });
}

export async function ensureSchema(pool: pg.Pool) {
  await pool.query(SCHEMA_SQL);
}

export async function listEvents(pool: pg.Pool): Promise<EventJson[]> {
  const result = await pool.query<EventRow>(
    `SELECT * FROM events ORDER BY sort_order ASC, updated_at DESC, id ASC`,
  );
  return result.rows.map(rowToEvent);
}

export async function getEvent(pool: pg.Pool, id: string): Promise<EventJson | null> {
  const result = await pool.query<EventRow>(`SELECT * FROM events WHERE id = $1`, [id]);
  return result.rows[0] ? rowToEvent(result.rows[0]) : null;
}

async function upsertOne(client: pg.Pool | pg.PoolClient, event: EventJson, sortOrder: number) {
  const createdAt = event.createdAt ?? event.updatedAt;
  await client.query(
    `INSERT INTO events (
        id, title, description, category, severity, light, status, owner_seat,
        collab_seats, triggers, residual_risk, red_line_gates, notes,
        updated_at, created_at, sort_order
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9::jsonb,$10,$11,$12::jsonb,$13,
        $14::timestamptz,$15::timestamptz,$16
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        severity = EXCLUDED.severity,
        light = EXCLUDED.light,
        status = EXCLUDED.status,
        owner_seat = EXCLUDED.owner_seat,
        collab_seats = EXCLUDED.collab_seats,
        triggers = EXCLUDED.triggers,
        residual_risk = EXCLUDED.residual_risk,
        red_line_gates = EXCLUDED.red_line_gates,
        notes = EXCLUDED.notes,
        updated_at = EXCLUDED.updated_at,
        sort_order = EXCLUDED.sort_order`,
    [
      event.id,
      event.title,
      event.description,
      event.category,
      event.severity,
      event.light,
      statusToDb(event.status),
      event.ownerSeat,
      JSON.stringify(event.collabSeats ?? []),
      JSON.stringify(event.triggers ?? []),
      event.residualRisk,
      JSON.stringify(event.redLineGates ?? []),
      JSON.stringify(event.notes ?? []),
      event.updatedAt,
      createdAt,
      sortOrder,
    ],
  );
}

export async function replaceEvents(pool: pg.Pool, events: EventJson[]): Promise<EventJson[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const keep = events.map((event) => event.id);
    for (const [index, event] of events.entries()) {
      await upsertOne(client, event, index);
    }
    if (keep.length === 0) {
      await client.query("DELETE FROM events");
    } else {
      await client.query(`DELETE FROM events WHERE NOT (id = ANY($1::text[]))`, [keep]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return listEvents(pool);
}

export async function upsertEvent(pool: pg.Pool, event: EventJson): Promise<EventJson> {
  const current = await pool.query<{ sort_order: number; created_at: Date }>(
    `SELECT sort_order, created_at FROM events WHERE id = $1`,
    [event.id],
  );
  const sortOrder = current.rows[0]?.sort_order ?? 0;
  if (current.rows[0]?.created_at && !event.createdAt) {
    event.createdAt = current.rows[0].created_at.toISOString();
  }
  await upsertOne(pool, event, sortOrder);
  const saved = await getEvent(pool, event.id);
  if (!saved) throw new Error("写入后读回失败");
  return saved;
}

export async function seedIfEmpty(pool: pg.Pool): Promise<number> {
  const count = await pool.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM events`);
  if (Number(count.rows[0]?.n ?? 0) > 0) return 0;
  const seed = loadSeedEvents();
  await replaceEvents(pool, seed);
  return seed.length;
}

export async function resetEvents(pool: pg.Pool): Promise<EventJson[]> {
  const seed = loadSeedEvents();
  return replaceEvents(pool, seed);
}
