"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BOARD_VIEW_KEY,
  LEGACY_STORAGE_KEYS,
  MINE_ONLY_KEY,
  MY_SEAT_KEY,
  STORAGE_KEY,
  STORE_VERSION,
} from "./constants";
import { SEED_PAYLOAD } from "./seed";
import type { BoardView, ColumnId, OwnerSeat, Risk, StorePayload } from "./types";
import {
  belongsToSeat,
  isReadableStore,
  migratePickerSeat,
  migrateRisk,
  migrateStore,
  nowIso,
  suggestLight,
} from "./utils";
import { usePersistedJson } from "./usePersistedJson";

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
  boardView: BoardView;
  setBoardView: (view: BoardView) => void;
  mySeat: OwnerSeat;
  setMySeat: (seat: OwnerSeat) => void;
  mineOnly: boolean;
  setMineOnly: (on: boolean) => void;
  upsert: (risk: Risk) => Promise<void>;
  moveRisk: (id: string, status: ColumnId, beforeId?: string | null) => Promise<void>;
  moveRiskSeat: (id: string, ownerSeat: OwnerSeat, beforeId?: string | null) => Promise<void>;
  resetSeed: () => Promise<void>;
  filtered: Risk[];
};

const StoreContext = createContext<StoreContextValue | null>(null);

function readLocal(): StorePayload | null {
  try {
    for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as StorePayload;
      if (!isReadableStore(parsed)) continue;
      return migrateStore(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

function writeLocal(payload: StorePayload) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...payload, version: STORE_VERSION, risks: payload.risks.map(migrateRisk) }),
  );
}

async function fetchRemote(): Promise<StorePayload | null> {
  try {
    const res = await fetch("/api/risks", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as StorePayload;
    if (!isReadableStore(data)) return null;
    return migrateStore(data);
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
  const [boardView, setBoardView] = usePersistedJson<BoardView>(BOARD_VIEW_KEY, "status");
  const [rawSeat, setRawSeat] = usePersistedJson<string>(MY_SEAT_KEY, "反将");
  const mySeat = migratePickerSeat(rawSeat);
  const setMySeat = useCallback((seat: OwnerSeat) => setRawSeat(seat), [setRawSeat]);
  const [mineOnly, setMineOnly] = usePersistedJson<boolean>(MINE_ONLY_KEY, false);

  const persist = useCallback(async (nextRisks: Risk[]) => {
    const payload: StorePayload = {
      version: STORE_VERSION,
      updatedAt: nowIso(),
      risks: nextRisks.map(migrateRisk),
    };
    setRisks(payload.risks);
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
      if (!local && !remote) {
        writeLocal(SEED_PAYLOAD);
        await persist(SEED_PAYLOAD.risks);
      } else {
        const chosen = newer(local, remote);
        setRisks(chosen.risks.map(migrateRisk));
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
      const withMeta: Risk = migrateRisk({
        ...risk,
        collabSeats: risk.collabSeats ?? [],
        light: risk.light || suggestLight(risk),
        updatedAt: nowIso(),
      });
      const exists = risks.some((item) => item.id === withMeta.id);
      const next = exists
        ? risks.map((item) => (item.id === withMeta.id ? withMeta : item))
        : [withMeta, ...risks];
      await persist(next);
    },
    [persist, risks],
  );

  const place = useCallback(
    (moved: Risk, beforeId?: string | null) => {
      const others = risks.filter((item) => item.id !== moved.id);
      if (beforeId) {
        const index = others.findIndex((item) => item.id === beforeId);
        if (index >= 0) {
          others.splice(index, 0, moved);
          return others;
        }
      }
      return [...others, moved];
    },
    [risks],
  );

  const moveRisk = useCallback(
    async (id: string, status: ColumnId, beforeId?: string | null) => {
      const current = risks.find((item) => item.id === id);
      if (!current) return;
      const moved: Risk = {
        ...current,
        status,
        light:
          status === "closed"
            ? "绿"
            : status === "blocked"
              ? "红"
              : status === "watch"
                ? "黄"
                : current.light === "绿"
                  ? "灰"
                  : current.light,
        updatedAt: nowIso(),
      };
      await persist(place(moved, beforeId));
    },
    [persist, place, risks],
  );

  const moveRiskSeat = useCallback(
    async (id: string, ownerSeat: OwnerSeat, beforeId?: string | null) => {
      const current = risks.find((item) => item.id === id);
      if (!current) return;
      const moved: Risk = migrateRisk({
        ...current,
        ownerSeat,
        collabSeats: (current.collabSeats ?? []).filter((seat) => seat !== ownerSeat),
        updatedAt: nowIso(),
      });
      await persist(place(moved, beforeId));
    },
    [persist, place, risks],
  );

  const resetSeed = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
    try {
      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = (await res.json()) as StorePayload;
      writeLocal(data);
      setRisks(data.risks.map(migrateRisk));
      setPersistError(null);
    } catch {
      writeLocal(SEED_PAYLOAD);
      setRisks(SEED_PAYLOAD.risks);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return risks.filter((risk) => {
      if (mineOnly && !belongsToSeat(risk, mySeat)) return false;
      if (!mineOnly && filters.seat && !belongsToSeat(risk, filters.seat as OwnerSeat)) return false;
      if (filters.category && risk.category !== filters.category) return false;
      if (filters.severity && risk.severity !== filters.severity) return false;
      if (filters.light && risk.light !== filters.light) return false;
      if (q) {
        const blob = `${risk.id} ${risk.title} ${risk.description} ${risk.triggers.join(" ")} ${risk.ownerSeat} ${(risk.collabSeats ?? []).join(" ")}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [filters, mineOnly, mySeat, risks]);

  const value = useMemo<StoreContextValue>(
    () => ({
      risks,
      ready,
      persistError,
      filters,
      setFilters: (patch) => setFiltersState((prev) => ({ ...prev, ...patch })),
      resetFilters: () => setFiltersState(EMPTY_FILTERS),
      boardView,
      setBoardView,
      mySeat,
      setMySeat,
      mineOnly,
      setMineOnly,
      upsert,
      moveRisk,
      moveRiskSeat,
      resetSeed,
      filtered,
    }),
    [
      boardView,
      filtered,
      filters,
      mineOnly,
      moveRisk,
      moveRiskSeat,
      mySeat,
      persistError,
      ready,
      resetSeed,
      risks,
      setBoardView,
      setMineOnly,
      setMySeat,
      upsert,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useRiskStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useRiskStore 必须在 RiskProvider 内使用");
  return ctx;
}
