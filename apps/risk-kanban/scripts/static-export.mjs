#!/usr/bin/env node
/**
 * Static export for subdirectory hosting.
 * Next.js cannot `output: 'export'` while App Router route handlers exist,
 * so this hides `src/app/api` for the duration of the build.
 */
import { existsSync, renameSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const api = path.join(appRoot, "src/app/api");
const hidden = path.join(appRoot, ".api-hidden");

process.chdir(appRoot);
process.env.STATIC_EXPORT = "1";
process.env.BASE_PATH = process.env.BASE_PATH || "/loop-kanban";
if (process.env.NEXT_PUBLIC_API_BASE === undefined) {
  process.env.NEXT_PUBLIC_API_BASE = "/loop-kanban/api";
}

function hideApi() {
  if (existsSync(hidden)) rmSync(hidden, { recursive: true, force: true });
  if (existsSync(api)) renameSync(api, hidden);
}

function restoreApi() {
  if (!existsSync(hidden)) return;
  if (existsSync(api)) rmSync(api, { recursive: true, force: true });
  renameSync(hidden, api);
}

hideApi();
let status = 1;
try {
  const nextBin = path.join(appRoot, "node_modules/next/dist/bin/next");
  const result = spawnSync(process.execPath, [nextBin, "build"], {
    stdio: "inherit",
    env: process.env,
  });
  status = result.status ?? 1;
} finally {
  restoreApi();
}

process.exit(status);
