"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import type { BoardView, ColumnId, Light, OwnerSeat, Risk, StorePayload } from "./types";
import {
  belongsToSeat,
  isOwnerSeat,
  isReadableStore,
  migratePickerSeat,
  migrateRisk,
  migrateStore,
  nowIso,
  suggestLight,
} from "./utils";
import { eventsApiBase, eventsListUrl, eventsResetUrl } from "./paths";
import { usePersistedJson } from "./usePersistedJson";
import { useAuth } from "./auth";
import { authHeaders, parseAuthResponse } from "./session";

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
  seatLocked: boolean;
  isAdmin: boolean;
  logout: (() => void) | null;
  mineOnly: boolean;
  setMineOnly: (on: boolean) => void;
  upsert: (risk: Risk) => Promise<void>;
  moveRisk: (id: string, status: ColumnId, beforeId?: string | null) => Promise<void>;
  moveRiskSeat: (id: string, ownerSeat: OwnerSeat, beforeId?: string | null) => Promise<void>;
  moveRiskLight: (id: string, light: Light, beforeId?: string | null) => Promise<void>;
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

function payloadFromUnknown(data: unknown): StorePayload | null {
  if (Array.isArray(data)) {
    return migrateStore({ version: STORE_VERSION, updatedAt: nowIso(), risks: data as Risk[] });
  }
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const list = o.events ?? o.risks;
  if (Array.isArray(list)) {
    return migrateStore({
      version: typeof o.version === "number" ? o.version : STORE_VERSION,
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : nowIso(),
      risks: list as Risk[],
    });
  }
  if (isReadableStore(o as unknown as StorePayload)) return migrateStore(o as unknown as StorePayload);
  return null;
}

async function fetchRemote(): Promise<StorePayload | null> {
  const url = eventsListUrl();
  if (!url) return null;
  try {
    const res = await parseAuthResponse(await fetch(url, { cache: "no-store", headers: authHeaders() }));
    if (!res.ok) return null;
    return payloadFromUnknown(await res.json());
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
  const auth = useAuth();
  const sessionSeat = isOwnerSeat(auth.session?.seat) ? auth.session.seat : null;
  const isAdmin = Boolean(auth.session?.admin);
  const [risks, setRisks] = useState<Risk[]>(SEED_PAYLOAD.risks);
  const [ready, setReady] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);
  const apiAvailableRef = useRef(false);
  const [filters, setFiltersState] = useState<Filters>(EMPTY_FILTERS);
  const [boardView, setBoardView] = usePersistedJson<BoardView>(BOARD_VIEW_KEY, "light");
  const [rawSeat, setRawSeat] = usePersistedJson<string>(MY_SEAT_KEY, "反将");
  const mySeat = sessionSeat ?? migratePickerSeat(rawSeat);
  const setMySeat = useCallback(
    (seat: OwnerSeat) => {
      if (sessionSeat) return;
      setRawSeat(seat);
    },
    [sessionSeat, setRawSeat],
  );
  const [mineOnly, setMineOnly] = usePersistedJson<boolean>(MINE_ONLY_KEY, false);

  useEffect(() => {
    if (sessionSeat) setRawSeat(sessionSeat);
  }, [sessionSeat, setRawSeat]);

  const persist = useCallback(async (nextRisks: Risk[]) => {
    const payload: StorePayload = {
      version: STORE_VERSION,
      updatedAt: nowIso(),
      risks: nextRisks.map(migrateRisk),
    };
    setRisks(payload.risks);
    writeLocal(payload);
    const listUrl = eventsListUrl();
    const dedicated = Boolean(eventsApiBase());
    if (!listUrl || (!dedicated && !apiAvailableRef.current)) {
      setPersistError(null);
      return;
    }
    try {
      const res = await parseAuthResponse(
        await fetch(listUrl, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(dedicated ? { events: payload.risks } : payload),
        }),
      );
      if (res.status === 401) throw new Error("未登录");
      if (res.status === 403) throw new Error("没有写入权限");
      if (!res.ok) throw new Error("保存失败");
      apiAvailableRef.current = true;
      setPersistError(null);
    } catch {
      setPersistError(
        dedicated ? "保存到服务器失败，已暂存在本机。" : "可选同步失败，看板已保存在本机 localStorage。",
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocal();
      const remote = await fetchRemote();
      if (cancelled) return;
      const dedicated = Boolean(eventsApiBase());
      const hasApi = remote !== null;
      apiAvailableRef.current = hasApi;
      if (dedicated) {
        if (remote) {
          setRisks(remote.risks.map(migrateRisk));
          writeLocal(remote);
          setPersistError(null);
        } else if (local) {
          setRisks(local.risks.map(migrateRisk));
          setPersistError("API 不可用，暂用本机缓存。");
        } else {
          writeLocal(SEED_PAYLOAD);
          setRisks(SEED_PAYLOAD.risks.map(migrateRisk));
          setPersistError("API 不可用，暂用种子数据。");
        }
        setReady(true);
        return;
      }
      if (!local && !remote) {
        writeLocal(SEED_PAYLOAD);
        setRisks(SEED_PAYLOAD.risks.map(migrateRisk));
      } else {
        const chosen = newer(local, remote);
        setRisks(chosen.risks.map(migrateRisk));
        writeLocal(chosen);
        if (
          hasApi &&
          local &&
          remote &&
          new Date(local.updatedAt).getTime() > new Date(remote.updatedAt).getTime()
        ) {
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

  const moveRiskLight = useCallback(
    async (id: string, light: Light, beforeId?: string | null) => {
      const current = risks.find((item) => item.id === id);
      if (!current) return;
      const moved: Risk = {
        ...current,
        light,
        updatedAt: nowIso(),
      };
      await persist(place(moved, beforeId));
    },
    [persist, place, risks],
  );

  const resetSeed = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
    writeLocal(SEED_PAYLOAD);
    setRisks(SEED_PAYLOAD.risks.map(migrateRisk));
    setPersistError(null);
    const resetUrl = eventsResetUrl();
    const dedicated = Boolean(eventsApiBase());
    if (!resetUrl || (!dedicated && !apiAvailableRef.current)) return;
    try {
      const res = await parseAuthResponse(
        await fetch(resetUrl, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(dedicated ? {} : { action: "reset" }),
        }),
      );
      if (res.status === 403) throw new Error("重置需要正将");
      if (!res.ok) throw new Error("reset failed");
      const parsed = payloadFromUnknown(await res.json());
      if (parsed) {
        writeLocal(parsed);
        setRisks(parsed.risks.map(migrateRisk));
        apiAvailableRef.current = true;
      }
    } catch {
      setPersistError(
        dedicated ? "服务器重置失败，本机已恢复种子。" : "可选同步失败，种子已恢复到本机 localStorage。",
      );
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
      seatLocked: Boolean(sessionSeat),
      isAdmin,
      logout: auth.logout,
      mineOnly,
      setMineOnly,
      upsert,
      moveRisk,
      moveRiskSeat,
      moveRiskLight,
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
      moveRiskLight,
      mySeat,
      persistError,
      ready,
      resetSeed,
      risks,
      isAdmin,
      sessionSeat,
      setBoardView,
      setMineOnly,
      setMySeat,
      upsert,
      auth.logout,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useRiskStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useRiskStore 必须在 RiskProvider 内使用");
  return ctx;
}
