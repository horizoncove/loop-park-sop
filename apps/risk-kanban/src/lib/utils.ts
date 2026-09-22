import { clsx, type ClassValue } from "clsx";
import type { CardGate, Light, OwnerSeat, Risk, RiskNote, StorePayload } from "./types";
import { GLOBAL_GATES, LIGHTS, OWNER_SEATS, STORE_VERSION } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatRelative(iso: string, now = new Date()) {
  const d = new Date(iso);
  const diff = now.getTime() - d.getTime();
  if (Number.isNaN(d.getTime())) return "—";
  const min = Math.round(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} 天前`;
  return formatDateTime(iso);
}

export function gateTitle(id: string) {
  return GLOBAL_GATES.find((g) => g.id === id)?.title ?? id;
}

export function openGateCount(gates: CardGate[]) {
  return gates.filter((g) => !g.checked).length;
}

export function suggestLight(risk: Pick<Risk, "status" | "redLineGates" | "severity">): Light {
  if (risk.status === "closed") return "绿";
  const open = openGateCount(risk.redLineGates);
  if (risk.status === "blocked" || (open > 0 && risk.severity === "P0")) return "红";
  if (risk.status === "watch" || open > 0) return "黄";
  if (risk.status === "todo") return "灰";
  return "黄";
}

export function uid(prefix = "n") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isLight(value: unknown): value is Light {
  return typeof value === "string" && (LIGHTS as readonly string[]).includes(value);
}

export function isOwnerSeat(value: unknown): value is OwnerSeat {
  return typeof value === "string" && (OWNER_SEATS as readonly string[]).includes(value);
}

type SeatHint = Partial<Pick<Risk, "category" | "title" | "description" | "id">>;

function blobOf(hint?: SeatHint) {
  return `${hint?.id ?? ""} ${hint?.category ?? ""} ${hint?.title ?? ""} ${hint?.description ?? ""}`;
}

function splitFengYao(hint?: SeatHint): OwnerSeat {
  const blob = blobOf(hint);
  if (
    hint?.category === "竞品客流" ||
    /情报|竞品|高校|日历|客流|报知|舆情监测/.test(blob)
  ) {
    return "风将";
  }
  return "谣将";
}

function splitHuoTuo(hint?: SeatHint): OwnerSeat {
  const blob = blobOf(hint);
  if (
    /动线|市集|租户|商管|借场|经营|交铺商管/.test(blob) ||
    (hint?.category === "活动造场与联赛" && !/消防|开业条件|疏散/.test(blob))
  ) {
    return "脱将";
  }
  if (
    hint?.category === "安全消防物业" ||
    hint?.category === "建设工期开业" ||
    /消防|开业条件|疏散|物业安全|排烟|否决|进场/.test(blob)
  ) {
    return "火将";
  }
  return "火将";
}

/** Map legacy 风谣/火脱 (and already-split names) onto the eight seats. */
export function normalizeSeat(value: unknown, hint?: SeatHint): OwnerSeat | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (isOwnerSeat(v)) return v;
  if (v === "风谣") return splitFengYao(hint);
  if (v === "火脱") return splitHuoTuo(hint);
  return null;
}

export function migratePickerSeat(value: unknown): OwnerSeat {
  if (value === "风谣") return "谣将";
  if (value === "火脱") return "火将";
  return normalizeSeat(value) ?? "反将";
}

export function belongsToSeat(risk: Pick<Risk, "ownerSeat" | "collabSeats">, seat: OwnerSeat) {
  if (risk.ownerSeat === seat) return true;
  return (risk.collabSeats ?? []).includes(seat);
}

export function uniqueSeats(seats: OwnerSeat[], except?: OwnerSeat) {
  return OWNER_SEATS.filter((seat) => seats.includes(seat) && seat !== except);
}

export function gatesForSeat(seat: OwnerSeat) {
  return GLOBAL_GATES.filter((gate) => gate.enforcingSeats.includes(seat));
}

export function migrateRisk(raw: Risk): Risk {
  const hint: SeatHint = {
    id: raw.id,
    category: raw.category,
    title: raw.title,
    description: raw.description,
  };
  const ownerSeat = normalizeSeat(raw.ownerSeat, hint) ?? "正将";
  const collabSeats = uniqueSeats(
    (raw.collabSeats ?? [])
      .map((seat) => normalizeSeat(seat, hint))
      .filter((seat): seat is OwnerSeat => Boolean(seat)),
    ownerSeat,
  );
  const notes = (raw.notes ?? []).map((item) => {
    const authorSeat: RiskNote["authorSeat"] =
      item.authorSeat === "系统" ? "系统" : (normalizeSeat(item.authorSeat, hint) ?? ownerSeat);
    return { ...item, authorSeat };
  });
  return { ...raw, ownerSeat, collabSeats, notes, light: isLight(raw.light) ? raw.light : suggestLight(raw) };
}

export function migrateStore(payload: StorePayload): StorePayload {
  return {
    version: STORE_VERSION,
    updatedAt: payload.updatedAt,
    risks: payload.risks.map(migrateRisk),
  };
}

export function isReadableStore(payload: StorePayload | null): payload is StorePayload {
  return Boolean(payload && Array.isArray(payload.risks) && payload.risks.length > 0);
}

export function isCurrentStore(payload: StorePayload | null): payload is StorePayload {
  return Boolean(isReadableStore(payload) && payload.version >= STORE_VERSION);
}
