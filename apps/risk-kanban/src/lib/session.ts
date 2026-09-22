const TOKEN_KEY = "loop-kanban-session-token-v1";
export const AUTH_LOST_EVENT = "loop-kanban-auth-lost";

export type AuthSession = {
  token: string;
  seat: string;
  admin: boolean;
};

export function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeStoredToken(token: string | null) {
  try {
    if (!token) sessionStorage.removeItem(TOKEN_KEY);
    else sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // private mode
  }
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = readStoredToken();
  const headers = new Headers(extra);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

export function notifyAuthLost() {
  writeStoredToken(null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_LOST_EVENT));
  }
}

export async function parseAuthResponse(res: Response) {
  if (res.status === 401) notifyAuthLost();
  return res;
}
