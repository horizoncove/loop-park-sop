/** Prefixed API URL. Next.js does not add `basePath` to `fetch()`. */
export function apiUrl(path = "/api/risks") {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
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
