"use client";

import { Search, X } from "lucide-react";
import { CATEGORIES, LIGHTS, OWNER_SEATS, SEVERITIES } from "@/lib/constants";
import { useRiskStore } from "@/lib/store";

export function BoardFilters() {
  const { filters, setFilters, resetFilters, filtered, risks } = useRiskStore();
  const active =
    Boolean(filters.category || filters.seat || filters.severity || filters.light || filters.query);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <label className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
        <input
          value={filters.query}
          onChange={(e) => setFilters({ query: e.target.value })}
          placeholder="搜索编号 / 标题 / 触发条件"
          className="w-full rounded-xl border border-line bg-panel py-2 pl-9 pr-3 text-sm text-paper outline-none placeholder:text-mute/70 focus:border-gold/50"
        />
      </label>
      <FilterSelect
        label="分类"
        value={filters.category}
        onChange={(v) => setFilters({ category: v })}
        options={CATEGORIES.map((c) => ({ value: c, label: c }))}
      />
      <FilterSelect
        label="席位"
        value={filters.seat}
        onChange={(v) => setFilters({ seat: v })}
        options={OWNER_SEATS.map((c) => ({ value: c, label: c }))}
      />
      <FilterSelect
        label="等级"
        value={filters.severity}
        onChange={(v) => setFilters({ severity: v })}
        options={SEVERITIES.map((c) => ({ value: c, label: c }))}
      />
      <FilterSelect
        label="灯色"
        value={filters.light}
        onChange={(v) => setFilters({ light: v })}
        options={LIGHTS.map((c) => ({ value: c, label: `${c}灯` }))}
      />
      {active ? (
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-sm text-mute hover:text-paper"
        >
          <X className="h-4 w-4" />
          清除
        </button>
      ) : null}
      <p className="text-xs text-mute lg:ml-auto">
        显示 {filtered.length} / {risks.length}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-xs text-mute">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full min-w-[140px] rounded-xl border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-gold/50"
      >
        <option value="">全部</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
