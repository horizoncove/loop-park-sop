import { readStore, upsertRisk } from "@/lib/server-store";
import type { Risk } from "@/lib/types";
import { nowIso } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/risks/[id]">,
) {
  const { id } = await ctx.params;
  const store = await readStore();
  const risk = store.risks.find((item) => item.id === decodeURIComponent(id));
  if (!risk) {
    return Response.json({ error: "未找到该风险" }, { status: 404 });
  }
  return Response.json(risk);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/risks/[id]">,
) {
  const { id } = await ctx.params;
  const patch = (await request.json()) as Partial<Risk>;
  const store = await readStore();
  const current = store.risks.find((item) => item.id === decodeURIComponent(id));
  if (!current) {
    return Response.json({ error: "未找到该风险" }, { status: 404 });
  }
  const next: Risk = {
    ...current,
    ...patch,
    id: current.id,
    updatedAt: nowIso(),
  };
  const saved = await upsertRisk(next);
  return Response.json(saved.risks.find((item) => item.id === current.id));
}
