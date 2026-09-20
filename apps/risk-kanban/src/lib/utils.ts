import { clsx, type ClassValue } from "clsx";
import type { CardGate, GateId, Light, Risk } from "./types";
import { GLOBAL_GATES } from "./constants";

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

export function gateTitle(id: GateId) {
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
