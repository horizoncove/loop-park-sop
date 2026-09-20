"use client";

import Link from "next/link";
import { BoardFilters } from "@/components/BoardFilters";
import { KanbanBoard } from "@/components/KanbanBoard";
import { useRiskStore } from "@/lib/store";

export default function HomePage() {
  const { boardView } = useRiskStore();
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 lg:px-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">
            {boardView === "seat" ? "按席位看板 · 千门八将" : "风险看板"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-mute">
            {boardView === "seat"
              ? "六席合席：正将 / 提将 / 风谣 / 反将 / 火脱 / 除将。拖动卡片改主责席；共主在卡片上标注。"
              : "从待排查到红灯阻断，再到关闭/绿灯。也可切到「按席位」把风险分到八将。"}{" "}
            <Link href="/seats" className="text-gold hover:underline">
              席位仪表盘
            </Link>
            {" · "}
            <Link href="/gates" className="text-gold hover:underline">
              红线闸
            </Link>
          </p>
        </div>
        <div className="flex gap-2 text-[11px] text-mute">
          <Legend c="bg-red-500" t="红灯阻断" />
          <Legend c="bg-amber-400" t="黄灯观察" />
          <Legend c="bg-emerald-400" t="绿灯闭环" />
          <Legend c="bg-stone-400" t="灰色待核" />
        </div>
      </div>
      <BoardFilters />
      <div className="mt-4">
        <KanbanBoard />
      </div>
    </div>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-2 py-1">
      <span className={`h-2 w-2 rounded-full ${c}`} />
      {t}
    </span>
  );
}
