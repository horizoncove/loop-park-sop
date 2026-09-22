import { STORE_VERSION } from "@/lib/constants";
import { readStore, resetStore, writeStore } from "@/lib/server-store";
import { SEED_PAYLOAD } from "@/lib/seed";
import type { StorePayload } from "@/lib/types";
import { nowIso } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await readStore();
  return Response.json(store);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<StorePayload> & { reset?: boolean };
  if (body.reset) {
    const store = await resetStore();
    return Response.json(store);
  }
  if (!Array.isArray(body.risks)) {
    return Response.json({ error: "risks 必须是数组" }, { status: 400 });
  }
  const store = await writeStore({
    version: STORE_VERSION,
    updatedAt: nowIso(),
    risks: body.risks,
  });
  return Response.json(store);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string };
  if (body.action === "reset") {
    const store = await resetStore();
    return Response.json(store);
  }
  const store = await writeStore({ ...SEED_PAYLOAD, updatedAt: nowIso() });
  return Response.json(store);
}
