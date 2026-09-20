"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { STORAGE_KEY } from "./constants";
import { SEED_PAYLOAD } from "./seed";
import type { ColumnId, Risk, StorePayload } from "./types";
import { nowIso, suggestLight } from "./utils";

type Filters = {
  category: string;
  seat: string;
  severity: string;
  light: string;
  query: string;
};

const EMPTY_FILTERS: Filters = {
  category: "",
  seat: "",
  severity: "",
  light: "",
  query: "",
};

type StoreContextValue = {
  risks: Risk[];
  ready: boolean;
  persistError: string | null;
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  upsert: (risk: Risk) => Promise<void>;
  moveRisk: (id: string, status: ColumnId, beforeId?: string | null) => Promise<void>;
  resetSeed: () => Promise<void>;
  filtered: Risk[];
};

const StoreContext = createContext<StoreContextValue | null>(null);

function readLocal(): StorePayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorePayload;
    if (!Array.isArray(parsed.risks) || parsed.risks.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocal(payload: StorePayload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

async function fetchRemote(): Promise<StorePayload | null> {
  try {
    const res = await fetch("/api/risks", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as StorePayload;
    if (!Array.isArray(data.risks)) return null;
    return data;
  } catch {
    return null;
  }
}

function newer(a: StorePayload | null, b: StorePayload | null) {
  if (a && !b) return a;
  if (b && !a) return b;
  if (!a && !b) return SEED_PAYLOAD;
  const at = new Date(a!.updatedAt).getTime();
  const bt = new Date(b!.updatedAt).getTime();
  if (Number.isNaN(at) && Number.isNaN(bt)) return a!;
  if (Number.isNaN(at)) return b!;
  if (Number.isNaN(bt)) return a!;
  return at >= bt ? a! : b!;
}

export function RiskProvider({ children }: { children: React.ReactNode }) {
  const [risks, setRisks] = useState<Risk[]>(SEED_PAYLOAD.risks);
  const [ready, setReady] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<Filters>(EMPTY_FILTERS);

  const persist = useCallback(async (nextRisks: Risk[]) => {
    const payload: StorePayload = { version: 1, updatedAt: nowIso(), risks: nextRisks };
    setRisks(nextRisks);
    writeLocal(payload);
    try {
      const res = await fetch("/api/risks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("保存失败");
      setPersistError(null);
    } catch {
      setPersistError("服务端文件写入失败，已保存在本机 localStorage。");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocal();
      const remote = await fetchRemote();
      if (cancelled) return;
      if (!local && (!remote || remote.risks.length === 0)) {
        writeLocal(SEED_PAYLOAD);
        await persist(SEED_PAYLOAD.risks);
      } else {
        const chosen = newer(local, remote);
        setRisks(chosen.risks);
        writeLocal(chosen);
        if (local && remote && new Date(local.updatedAt).getTime() > new Date(remote.updatedAt).getTime()) {
          await persist(local.risks);
        }
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [persist]);

  const upsert = useCallback(
    async (risk: Risk) => {
      const withMeta: Risk = {
        ...risk,
        light: risk.light || suggestLight(risk),
        updatedAt: nowIso(),
      };
      const exists = risks.some((item) => item.id === withMeta.id);
      const next = exists
        ? risks.map((item) => (item.id === withMeta.id ? withMeta : item))
        : [withMeta, ...risks];
      await persist(next);
    },
    [persist, risks],
  );

  const moveRisk = useCallback(
    async (id: string, status: ColumnId, beforeId?: string | null) => {
      const current = risks.find((item) => item.id === id);
      if (!current) return;
      const moved: Risk = {
        ...current,
        status,
        light: status === "closed" ? "绿" : status === "blocked" ? "红" : status === "watch" ? "黄" : current.light === "绿" ? "灰" : current.light,
        updatedAt: nowIso(),
      };
      const others = risks.filter((item) => item.id !== id);
      if (beforeId) {
        const index = others.findIndex((item) => item.id === beforeId);
        if (index >= 0) {
          others.splice(index, 0, moved);
          await persist(others);
          return;
        }
      }
      await persist([...others, moved]);
    },
    [persist, risks],
  );

  const resetSeed = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    try {
      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = (await res.json()) as StorePayload;
      writeLocal(data);
      setRisks(data.risks);
      setPersistError(null);
    } catch {
      writeLocal(SEED_PAYLOAD);
      setRisks(SEED_PAYLOAD.risks);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return risks.filter((risk) => {
      if (filters.category && risk.category !== filters.category) return false;
      if (filters.seat && risk.ownerSeat !== filters.seat) return false;
      if (filters.severity && risk.severity !== filters.severity) return false;
      if (filters.light && risk.light !== filters.light) return false;
      if (q) {
        const blob = `${risk.id} ${risk.title} ${risk.description} ${risk.triggers.join(" ")}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [filters, risks]);

  const value = useMemo<StoreContextValue>(
    () => ({
      risks,
      ready,
      persistError,
      filters,
      setFilters: (patch) => setFiltersState((prev) => ({ ...prev, ...patch })),
      resetFilters: () => setFiltersState(EMPTY_FILTERS),
      upsert,
      moveRisk,
      resetSeed,
      filtered,
    }),
    [filtered, filters, moveRisk, persistError, ready, resetSeed, risks, upsert],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useRiskStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useRiskStore 必须在 RiskProvider 内使用");
  return ctx;
}
