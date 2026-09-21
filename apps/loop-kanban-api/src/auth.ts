import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Context } from "hono";

export const SEATS = ["正将", "提将", "风将", "谣将", "反将", "火将", "脱将", "除将"] as const;
export type SeatName = (typeof SEATS)[number];

export type Identity = {
  kind: "seat" | "api-key";
  seat: SeatName | "系统";
  admin: boolean;
};

type SessionClaims = {
  v: 1;
  seat: SeatName;
  admin: boolean;
  exp: number;
};

function env(name: string) {
  return (process.env[name] ?? "").trim();
}

function safeEqual(a: string, b: string) {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export function apiKey() {
  return env("API_KEY");
}

export function sessionSecret() {
  return env("SESSION_SECRET") || apiKey() || "dev-only-change-me";
}

export function sessionTtlSeconds() {
  const n = Number(env("SESSION_TTL_SECONDS") || 43200);
  return Number.isFinite(n) && n > 60 ? n : 43200;
}

export function corsOrigins() {
  const raw = env("CORS_ORIGINS");
  if (!raw) return ["*"];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function writesNeedAuth() {
  return env("REQUIRE_AUTH") === "1" || Boolean(apiKey());
}

export function readsNeedAuth() {
  return env("REQUIRE_AUTH") === "1";
}

export function isSeat(value: string): value is SeatName {
  return (SEATS as readonly string[]).includes(value);
}

export function signSession(seat: SeatName): string {
  const claims: SessionClaims = {
    v: 1,
    seat,
    admin: seat === "正将",
    exp: Math.floor(Date.now() / 1000) + sessionTtlSeconds(),
  };
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string): SessionClaims | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionClaims;
    if (claims.v !== 1 || !isSeat(claims.seat)) return null;
    if (claims.exp < Math.floor(Date.now() / 1000)) return null;
    return { ...claims, admin: claims.seat === "正将" };
  } catch {
    return null;
  }
}

export function bearerToken(c: Context): string | null {
  const header = c.req.header("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (match?.[1]) return match[1].trim();
  const key = c.req.header("x-api-key");
  return key?.trim() || null;
}

export function readIdentity(c: Context): Identity | null {
  const token = bearerToken(c);
  if (!token) return null;
  const key = apiKey();
  if (key && safeEqual(token, key)) {
    return { kind: "api-key", seat: "系统", admin: true };
  }
  const session = verifySession(token);
  if (!session) return null;
  return { kind: "seat", seat: session.seat, admin: session.admin };
}

export function authConfig() {
  return {
    loginRequired: true,
    requireAuth: readsNeedAuth(),
    writesNeedAuth: writesNeedAuth(),
    seats: [...SEATS],
  };
}
