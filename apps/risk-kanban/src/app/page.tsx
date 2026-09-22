"use client";

import Link from "next/link";
import { BoardFilters } from "@/components/BoardFilters";
import { KanbanBoard } from "@/components/KanbanBoard";
import { useRiskStore } from "@/lib/store";

const TITLE: Record<string, string> = {
  light: "按灯性",
  seat: "按席位",
  status: "按状态",
};

const HINT: Record<string, string> = {
  light: "拖动事件改灯性：红阻断 · 黄观察 · 绿闭环 · 灰待分级",
  seat: "拖动事件改主责席",
  status: "待排查 → 关闭",
};

export default function HomePage() {
  const { boardView } = useRiskStore();
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4 lg:px-6">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h1 className="text-[16px] font-medium tracking-tight">{TITLE[boardView] ?? "事件看板"}</h1>
        <p className="text-[12px] text-mute">
          {HINT[boardView]}
          {" · "}
          <Link href="/seats" className="hover:underline">
            席位
          </Link>
          {" · "}
          <Link href="/gates" className="hover:underline">
            红线闸
          </Link>
        </p>
      </div>
      <BoardFilters />
      <div className="mt-3">
        <KanbanBoard />
      </div>
    </div>
  );
}
