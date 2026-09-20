import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Empty locally (`npm run dev` / `npm run build`). Production subdirectory: `BASE_PATH=/loop-kanban`. */
const basePath = process.env.BASE_PATH ?? "";
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  basePath,
  ...(basePath ? { assetPrefix: basePath } : {}),
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_EXPORT: isStaticExport ? "1" : "",
  },
  turbopack: {
    root,
  },
};

export default nextConfig;
