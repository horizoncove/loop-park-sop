"use client";

import Link from "next/link";
import { BoardFilters } from "@/components/BoardFilters";
import { KanbanBoard } from "@/components/KanbanBoard";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 lg:px-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">风险看板</h1>
          <p className="mt-1 max-w-3xl text-sm text-mute">
            从待排查到红灯阻断，再到关闭/绿灯。拖动卡片即可过闸；点进卡片补备注、核对红线。
            全局红线见{" "}
            <Link href="/gates" className="text-gold hover:underline">
              红线闸
            </Link>
            。
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
