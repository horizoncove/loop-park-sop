export const STATUS_TO_DB: Record<string, string> = {
  todo: "待排查",
  investigating: "排查中",
  watch: "黄灯观察",
  blocked: "红灯阻断",
  closed: "已关闭/绿",
};

export const STATUS_FROM_DB: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_TO_DB).map(([id, label]) => [label, id]),
);

export type EventJson = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  light: string;
  status: string;
  ownerSeat: string;
  collabSeats: string[];
  triggers: string[];
  residualRisk: string;
  redLineGates: unknown[];
  notes: unknown[];
  updatedAt: string;
  createdAt?: string;
};

export type EventRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  light: string;
  status: string;
  owner_seat: string;
  collab_seats: unknown;
  triggers: string;
  residual_risk: string;
  red_line_gates: unknown;
  notes: string;
  updated_at: Date | string;
  created_at: Date | string;
  sort_order: number;
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch {
      return trimmed.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    }
  }
  return [];
}

function asJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function iso(value: Date | string | undefined): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

export function statusToDb(status: string | undefined): string {
  if (!status) return STATUS_TO_DB.todo;
  return STATUS_TO_DB[status] ?? status;
}

export function statusFromDb(status: string | undefined): string {
  if (!status) return "todo";
  return STATUS_FROM_DB[status] ?? status;
}

export function rowToEvent(row: EventRow): EventJson {
  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    category: row.category ?? "",
    severity: row.severity ?? "P2",
    light: row.light ?? "灰",
    status: statusFromDb(row.status),
    ownerSeat: row.owner_seat ?? "反将",
    collabSeats: asStringArray(row.collab_seats),
    triggers: asStringArray(row.triggers),
    residualRisk: row.residual_risk ?? "",
    redLineGates: asJsonArray(row.red_line_gates),
    notes: asJsonArray(row.notes),
    updatedAt: iso(row.updated_at),
    createdAt: iso(row.created_at),
  };
}

export function eventFromBody(raw: unknown, fallbackId?: string): EventJson | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? fallbackId ?? "").trim();
  if (!id) return null;
  const updatedAt = typeof o.updatedAt === "string" ? o.updatedAt : iso(o.updated_at as string | Date | undefined);
  const createdAt =
    typeof o.createdAt === "string"
      ? o.createdAt
      : typeof o.created_at === "string"
        ? o.created_at
        : updatedAt;
  return {
    id,
    title: String(o.title ?? ""),
    description: String(o.description ?? ""),
    category: String(o.category ?? ""),
    severity: String(o.severity ?? "P2"),
    light: String(o.light ?? "灰"),
    status: statusFromDb(String(o.status ?? "todo")),
    ownerSeat: String(o.ownerSeat ?? o.owner_seat ?? "反将"),
    collabSeats: asStringArray(o.collabSeats ?? o.collab_seats),
    triggers: asStringArray(o.triggers),
    residualRisk: String(o.residualRisk ?? o.residual_risk ?? ""),
    redLineGates: asJsonArray(o.redLineGates ?? o.red_line_gates),
    notes: asJsonArray(o.notes),
    updatedAt,
    createdAt,
  };
}

export function eventsFromBody(raw: unknown): EventJson[] | null {
  if (Array.isArray(raw)) {
    const list = raw.map((item) => eventFromBody(item)).filter((item): item is EventJson => Boolean(item));
    return list;
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const list = o.events ?? o.risks;
  if (!Array.isArray(list)) return null;
  return list.map((item) => eventFromBody(item)).filter((item): item is EventJson => Boolean(item));
}

export function patchEvent(current: EventJson, raw: unknown): EventJson {
  const patch = eventFromBody({ ...current, ...(raw && typeof raw === "object" ? raw : {}), id: current.id }, current.id);
  return patch ?? current;
}
