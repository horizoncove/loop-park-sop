"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CATEGORIES, OWNER_SEATS } from "@/lib/constants";
import { useRiskStore } from "@/lib/store";
import type { Category, OwnerSeat, Risk, Severity } from "@/lib/types";
import { nowIso, uid } from "@/lib/utils";

export function NewRiskButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-line py-2 text-xs text-mute hover:border-gold/40 hover:text-gold"
      >
        <Plus className="h-3.5 w-3.5" />
        新增风险
      </button>
      {open ? <NewRiskModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function NewRiskModal({ onClose }: { onClose: () => void }) {
  const { upsert, risks, mySeat } = useRiskStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("组织协作");
  const [severity, setSeverity] = useState<Severity>("P1");
  const [ownerSeat, setOwnerSeat] = useState<OwnerSeat>(mySeat);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const seq = risks.length + 1;
    const risk: Risk = {
      id: `N-${String(seq).padStart(2, "0")}-${uid("x").slice(-4)}`,
      title: title.trim(),
      description: description.trim() || "待补充描述。",
      category,
      severity,
      light: "灰",
      ownerSeat,
      collabSeats: [],
      triggers: [],
      residualRisk: "待评估。",
      redLineGates: [],
      status: "todo",
      notes: [],
      updatedAt: nowIso(),
    };
    await upsert(risk);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-2xl"
      >
        <h3 className="text-base font-semibold">新增风险卡片</h3>
        <p className="mt-1 text-xs text-mute">先记上，再补触发条件与红线闸。</p>
        <label className="mt-4 block text-xs text-mute">
          标题
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-gold/50"
            required
          />
        </label>
        <label className="mt-3 block text-xs text-mute">
          描述
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-gold/50"
          />
        </label>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-mute">
          <label>
            分类
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1 w-full rounded-xl border border-line bg-panel px-2 py-2 text-sm text-paper"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            等级
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="mt-1 w-full rounded-xl border border-line bg-panel px-2 py-2 text-sm text-paper"
            >
              <option>P0</option>
              <option>P1</option>
              <option>P2</option>
            </select>
          </label>
          <label>
            席位
            <select
              value={ownerSeat}
              onChange={(e) => setOwnerSeat(e.target.value as OwnerSeat)}
              className="mt-1 w-full rounded-xl border border-line bg-panel px-2 py-2 text-sm text-paper"
            >
              {OWNER_SEATS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm text-mute">
            取消
          </button>
          <button type="submit" className="rounded-xl bg-gold px-4 py-2 text-sm font-medium text-ink">
            加入待排查
          </button>
        </div>
      </form>
    </div>
  );
}
