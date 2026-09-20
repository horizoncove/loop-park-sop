"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { OWNER_SEATS } from "./constants";
import { eventsApiBase } from "./paths";
import {
  AUTH_LOST_EVENT,
  authHeaders,
  readStoredToken,
  writeStoredToken,
  type AuthSession,
} from "./session";
import type { OwnerSeat } from "./types";

type AuthConfig = {
  loginRequired: boolean;
  requireAuth: boolean;
  writesNeedAuth: boolean;
  seats: string[];
};

type AuthContextValue = {
  ready: boolean;
  loginRequired: boolean;
  session: AuthSession | null;
  login: (seat: OwnerSeat, password: string) => Promise<string | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  const logout = useCallback(() => {
    writeStoredToken(null);
    setSession(null);
  }, []);

  useEffect(() => {
    const onLost = () => setSession(null);
    window.addEventListener(AUTH_LOST_EVENT, onLost);
    return () => window.removeEventListener(AUTH_LOST_EVENT, onLost);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const base = eventsApiBase();
      if (!base) {
        setLoginRequired(false);
        setReady(true);
        return;
      }
      let config: AuthConfig = {
        loginRequired: true,
        requireAuth: true,
        writesNeedAuth: true,
        seats: [...OWNER_SEATS],
      };
      try {
        const res = await fetch(`${base}/auth/config`, { cache: "no-store" });
        if (res.ok) config = (await res.json()) as AuthConfig;
      } catch {
        // API down: still show login if we have a dedicated base
      }
      if (cancelled) return;
      setLoginRequired(Boolean(config.loginRequired));
      const token = readStoredToken();
      if (token) {
        try {
          const me = await fetch(`${base}/me`, { headers: authHeaders(), cache: "no-store" });
          if (me.ok) {
            const body = (await me.json()) as { seat?: string; admin?: boolean };
            if (body.seat) {
              setSession({ token, seat: body.seat, admin: Boolean(body.admin) });
            } else {
              writeStoredToken(null);
            }
          } else {
            writeStoredToken(null);
          }
        } catch {
          writeStoredToken(null);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (seat: OwnerSeat, password: string) => {
    const base = eventsApiBase();
    if (!base) return "当前没有配置事件 API";
    try {
      const res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seat, password }),
      });
      const body = (await res.json().catch(() => null)) as
        | { token?: string; seat?: string; admin?: boolean; error?: string }
        | null;
      if (!res.ok || !body?.token || !body.seat) {
        return body?.error || "席位或口令不对";
      }
      writeStoredToken(body.token);
      setSession({ token: body.token, seat: body.seat, admin: Boolean(body.admin) });
      return null;
    } catch {
      return "无法连接登录接口";
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ready, loginRequired, session, login, logout }),
    [login, loginRequired, logout, ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
