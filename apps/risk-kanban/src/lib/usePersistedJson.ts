"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export function usePersistedJson<T>(key: string, fallback: T): [T, (value: T) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const handler = () => onChange();
      window.addEventListener("storage", handler);
      window.addEventListener(key, handler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener(key, handler);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key) ?? JSON.stringify(fallback);
    } catch {
      return JSON.stringify(fallback);
    }
  }, [fallback, key]);

  const getServerSnapshot = useCallback(() => JSON.stringify(fallback), [fallback]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value = useMemo(() => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [fallback, raw]);

  const setValue = useCallback(
    (next: T) => {
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event(key));
    },
    [key],
  );

  return [value, setValue];
}
