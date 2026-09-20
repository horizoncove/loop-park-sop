/** Prefixed Next.js API URL. Next does not add `basePath` to `fetch()`. */
export function apiUrl(path = "/api/risks") {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

/** Dedicated events API, e.g. `/loop-kanban/api` or `http://127.0.0.1:3010/api`. */
export function eventsApiBase(): string | null {
  const raw = (process.env.NEXT_PUBLIC_API_BASE ?? "").trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function eventsListUrl(): string | null {
  const dedicated = eventsApiBase();
  if (dedicated) return `${dedicated}/events`;
  if (isStaticExport()) return null;
  return apiUrl("/api/risks");
}

export function eventsItemUrl(id: string): string {
  const dedicated = eventsApiBase();
  if (dedicated) return `${dedicated}/events/${encodeURIComponent(id)}`;
  return apiUrl(`/api/risks/${encodeURIComponent(id)}`);
}

export function eventsResetUrl(): string | null {
  const dedicated = eventsApiBase();
  if (dedicated) return `${dedicated}/events/reset`;
  if (isStaticExport()) return null;
  return apiUrl("/api/risks");
}

export function riskHref(id: string) {
  return `/risk?id=${encodeURIComponent(id)}`;
}

export function isStaticExport() {
  return process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
}

export function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}
