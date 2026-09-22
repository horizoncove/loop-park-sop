"use client";

import { Search, X } from "lucide-react";
import { CATEGORIES, LIGHTS, OWNER_SEATS, SEAT_META, SEVERITIES } from "@/lib/constants";
import { useRiskStore } from "@/lib/store";
import type { BoardView, OwnerSeat } from "@/lib/types";
import { cn } from "@/lib/utils";

const VIEWS: { id: BoardView; label: string }[] = [
  { id: "light", label: "按灯性" },
  { id: "seat", label: "按席位" },
  { id: "status", label: "按状态" },
];

export function BoardViewToggle({ className }: { className?: string }) {
  const { boardView, setBoardView } = useRiskStore();
  return (
    <div className={cn("flex border border-line text-[13px]", className)}>
      {VIEWS.map((view, index) => (
        <button
          key={view.id}
          type="button"
          onClick={() => setBoardView(view.id)}
          className={cn(
            "px-3 py-1.5",
            index > 0 ? "border-l border-line" : "",
            boardView === view.id ? "bg-ink text-bg" : "bg-surface text-mute hover:text-ink",
          )}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

export function BoardFilters() {
  const {
    filters,
    setFilters,
    resetFilters,
    filtered,
    risks,
    boardView,
    mySeat,
    setMySeat,
    seatLocked,
    mineOnly,
    setMineOnly,
  } = useRiskStore();
  const active = Boolean(filters.category || filters.seat || filters.severity || filters.light || filters.query);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <BoardViewToggle className="sm:hidden" />

      <label className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" />
        <input
          value={filters.query}
          onChange={(e) => setFilters({ query: e.target.value })}
          placeholder="搜索事件编号 / 标题 / 席位"
          className="w-full border border-line bg-surface py-1.5 pl-8 pr-2 text-[13px] text-ink outline-none placeholder:text-mute"
        />
      </label>
      <FilterSelect
        value={filters.category}
        onChange={(v) => setFilters({ category: v })}
        empty="全部分类"
        options={CATEGORIES.map((c) => ({ value: c, label: c }))}
      />
      {!mineOnly ? (
        <FilterSelect
          value={filters.seat}
          onChange={(v) => setFilters({ seat: v })}
          empty="全部席位"
          options={OWNER_SEATS.map((c) => ({ value: c, label: c }))}
        />
      ) : null}
      <FilterSelect
        value={filters.severity}
        onChange={(v) => setFilters({ severity: v })}
        empty="全部等级"
        options={SEVERITIES.map((c) => ({ value: c, label: c }))}
      />
      {boardView !== "light" ? (
        <FilterSelect
          value={filters.light}
          onChange={(v) => setFilters({ light: v })}
          empty="全部灯性"
          options={LIGHTS.map((c) => ({ value: c, label: `${c}灯` }))}
        />
      ) : null}
      <button
        type="button"
        onClick={() => setMineOnly(!mineOnly)}
        className={cn(
          "border px-2 py-1.5 text-[13px]",
          mineOnly ? "border-ink bg-ink text-bg" : "border-line text-mute hover:text-ink",
        )}
      >
        只看我的席
      </button>
      {seatLocked ? (
        <span className="border border-line bg-surface px-2 py-1.5 text-[13px] text-ink" title={SEAT_META[mySeat].duty}>
          {mySeat}
        </span>
      ) : (
        <select
          value={mySeat}
          onChange={(e) => setMySeat(e.target.value as OwnerSeat)}
          className="border border-line bg-surface px-2 py-1.5 text-[13px] text-ink"
          title={SEAT_META[mySeat].duty}
        >
          {OWNER_SEATS.map((seat) => (
            <option key={seat} value={seat}>
              {seat}
            </option>
          ))}
        </select>
      )}
      {active ? (
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1 border border-line px-2 py-1.5 text-[13px] text-mute hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
          清除
        </button>
      ) : null}
      <p className="text-[12px] text-mute lg:ml-auto">
        {filtered.length} / {risks.length}
      </p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  empty,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  empty: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-[104px] border border-line bg-surface px-2 py-1.5 text-[13px] text-ink"
    >
      <option value="">{empty}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
