"use client";

import Link from "next/link";
import { BoardFilters } from "@/components/BoardFilters";
import { KanbanBoard } from "@/components/KanbanBoard";
import { useRiskStore } from "@/lib/store";

export default function HomePage() {
  const { boardView } = useRiskStore();
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4 lg:px-6">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h1 className="text-[16px] font-medium tracking-tight">
          {boardView === "seat" ? "按席位" : "按状态"}
        </h1>
        <p className="text-[12px] text-mute">
          {boardView === "seat" ? "拖动卡片改主责席" : "待排查 → 关闭"}
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
