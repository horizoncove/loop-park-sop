import { promises as fs } from "node:fs";
import path from "node:path";
import { SEED_PAYLOAD } from "./seed";
import type { Risk, StorePayload } from "./types";
import { nowIso } from "./utils";

function dataFile() {
  return path.join(process.cwd(), "data", "risks.json");
}

function isPayload(value: unknown): value is StorePayload {
  if (!value || typeof value !== "object") return false;
  const v = value as StorePayload;
  return Array.isArray(v.risks);
}

export async function readStore(): Promise<StorePayload> {
  try {
    const raw = await fs.readFile(dataFile(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (isPayload(parsed) && parsed.risks.length > 0) {
      return { version: parsed.version ?? 1, updatedAt: parsed.updatedAt, risks: parsed.risks };
    }
  } catch {
    // first boot or empty file
  }
  await writeStore(SEED_PAYLOAD);
  return SEED_PAYLOAD;
}

export async function writeStore(payload: StorePayload) {
  const file = dataFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const next: StorePayload = {
    version: 1,
    updatedAt: payload.updatedAt ?? nowIso(),
    risks: payload.risks,
  };
  await fs.writeFile(file, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function upsertRisk(nextRisk: Risk) {
  const store = await readStore();
  const index = store.risks.findIndex((r) => r.id === nextRisk.id);
  const risks =
    index >= 0
      ? store.risks.map((r) => (r.id === nextRisk.id ? nextRisk : r))
      : [nextRisk, ...store.risks];
  return writeStore({ version: 1, updatedAt: nowIso(), risks });
}

export async function resetStore() {
  return writeStore({ ...SEED_PAYLOAD, updatedAt: nowIso() });
}
