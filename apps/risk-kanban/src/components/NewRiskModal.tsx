"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { CATEGORIES, OWNER_SEATS } from "@/lib/constants";
import { eventsSuggestUrl } from "@/lib/paths";
import { authHeaders, parseAuthResponse } from "@/lib/session";
import { useRiskStore } from "@/lib/store";
import type { Category, Light, OwnerSeat, Risk, Severity } from "@/lib/types";
import { nowIso, uid } from "@/lib/utils";

type SuggestField<T extends string> = {
  value: T;
  confidence: number;
  apply: boolean;
};

type SuggestPayload = {
  enabled: boolean;
  category: SuggestField<Category>;
  severity: SuggestField<Severity>;
  ownerSeat: SuggestField<OwnerSeat>;
  light: SuggestField<Light>;
  needsHumanReview: boolean;
  reviewProbability: number;
  error?: string;
};

function confidenceLabel(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function NewRiskButton({ defaultLight = "灰" }: { defaultLight?: Light }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1 border border-line py-2 text-[12px] text-mute hover:border-ink hover:text-ink"
      >
        <Plus className="h-3.5 w-3.5" />
        新建事件
      </button>
      {open ? <NewRiskModal defaultLight={defaultLight} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function NewRiskModal({ onClose, defaultLight }: { onClose: () => void; defaultLight: Light }) {
  const { upsert, risks, mySeat } = useRiskStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("组织协作");
  const [severity, setSeverity] = useState<Severity>("P1");
  const [ownerSeat, setOwnerSeat] = useState<OwnerSeat>(mySeat);
  const [light, setLight] = useState<Light>(defaultLight);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestPayload | null>(null);
  const canSuggest = Boolean(eventsSuggestUrl());

  const applySuggestion = (data: SuggestPayload) => {
    if (data.category.apply) setCategory(data.category.value);
    if (data.severity.apply) setSeverity(data.severity.value);
    if (data.ownerSeat.apply) setOwnerSeat(data.ownerSeat.value);
    if (data.light.apply) setLight(data.light.value);
  };

  const adoptAll = () => {
    if (!suggestion) return;
    setCategory(suggestion.category.value);
    setSeverity(suggestion.severity.value);
    setOwnerSeat(suggestion.ownerSeat.value);
    setLight(suggestion.light.value);
  };

  const runSuggest = async () => {
    const url = eventsSuggestUrl();
    if (!url || !title.trim()) return;
    setSuggesting(true);
    setSuggestError(null);
    try {
      const res = await parseAuthResponse(
        await fetch(url, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ title: title.trim(), description: description.trim() }),
        }),
      );
      const body = (await res.json().catch(() => null)) as SuggestPayload | { error?: string } | null;
      if (!res.ok) {
        setSuggestError((body && "error" in body && body.error) || "智能建议失败");
        return;
      }
      const data = body as SuggestPayload;
      setSuggestion(data);
      applySuggestion(data);
    } catch {
      setSuggestError("网络异常，智能建议暂不可用");
    } finally {
      setSuggesting(false);
    }
  };

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
      light,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md border border-line bg-surface p-5"
      >
        <h3 className="text-[16px] font-medium">新建事件</h3>
        <p className="mt-1 text-[12px] text-mute">先记上灯性与席位，再补触发条件与红线闸。</p>
        <label className="mt-4 block text-[12px] text-mute">
          标题
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border border-line bg-surface px-3 py-2 text-[14px] text-ink"
            required
          />
        </label>
        <label className="mt-3 block text-[12px] text-mute">
          描述
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full border border-line bg-surface px-3 py-2 text-[14px] text-ink"
          />
        </label>
        {canSuggest ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={suggesting || !title.trim()}
              onClick={() => void runSuggest()}
              className="inline-flex items-center gap-1 border border-ink px-3 py-1.5 text-[12px] text-ink disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {suggesting ? "建议中…" : "智能建议"}
            </button>
            {suggestion ? (
              <button
                type="button"
                onClick={adoptAll}
                className="border border-line px-3 py-1.5 text-[12px] text-mute hover:text-ink"
              >
                全部采用建议
              </button>
            ) : null}
            {suggestError ? <span className="text-[12px] text-signal-red">{suggestError}</span> : null}
          </div>
        ) : null}
        {suggestion ? (
          <p className="mt-2 text-[11px] leading-relaxed text-mute">
            TypeSafe：分类 {suggestion.category.value}（{confidenceLabel(suggestion.category.confidence)}）· 等级{" "}
            {suggestion.severity.value}（{confidenceLabel(suggestion.severity.confidence)}）· 席位{" "}
            {suggestion.ownerSeat.value}（{confidenceLabel(suggestion.ownerSeat.confidence)}）· 灯性{" "}
            {suggestion.light.value}（{confidenceLabel(suggestion.light.confidence)}）
            {suggestion.needsHumanReview
              ? ` · 建议人工核对（${confidenceLabel(suggestion.reviewProbability)}）`
              : ""}
          </p>
        ) : null}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-mute sm:grid-cols-4">
          <label>
            分类
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1 w-full border border-line bg-surface px-2 py-2 text-[13px] text-ink"
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
              className="mt-1 w-full border border-line bg-surface px-2 py-2 text-[13px] text-ink"
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
              className="mt-1 w-full border border-line bg-surface px-2 py-2 text-[13px] text-ink"
            >
              {OWNER_SEATS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            灯性
            <select
              value={light}
              onChange={(e) => setLight(e.target.value as Light)}
              className="mt-1 w-full border border-line bg-surface px-2 py-2 text-[13px] text-ink"
            >
              <option>红</option>
              <option>黄</option>
              <option>绿</option>
              <option>灰</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-[13px] text-mute hover:text-ink">
            取消
          </button>
          <button type="submit" className="border border-ink bg-ink px-4 py-2 text-[13px] font-medium text-bg">
            加入{light}灯
          </button>
        </div>
      </form>
    </div>
  );
}
