"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { CATEGORIES, OWNER_SEATS } from "@/lib/constants";
import { eventsSopAdviseUrl, eventsSuggestUrl } from "@/lib/paths";
import { authHeaders, parseAuthResponse } from "@/lib/session";
import { SOP_CADENCE_LABEL, type SopCadence } from "@/lib/sop";
import { useRiskStore } from "@/lib/store";
import type { CardGate, Category, GateId, Light, OwnerSeat, Risk, Severity } from "@/lib/types";
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
};

type SopAdvisePayload = {
  enabled: boolean;
  cadence: SuggestField<SopCadence>;
  gates: Array<{ id: GateId; title: string; probability: number; apply: boolean }>;
  sentiment: SuggestField<"蓝" | "黄" | "橙" | "红" | "不适用">;
  reportSla: SuggestField<"立即" | "1小时" | "4小时" | "24小时" | "无需上报">;
  escalateBajiang: { probability: number; apply: boolean };
  needsHumanReview: boolean;
  reviewProbability: number;
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
  const [gates, setGates] = useState<CardGate[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestPayload | null>(null);
  const [sopAdvice, setSopAdvice] = useState<SopAdvisePayload | null>(null);
  const canSuggest = Boolean(eventsSuggestUrl() || eventsSopAdviseUrl());

  const applySuggestion = (data: SuggestPayload) => {
    if (data.category.apply) setCategory(data.category.value);
    if (data.severity.apply) setSeverity(data.severity.value);
    if (data.ownerSeat.apply) setOwnerSeat(data.ownerSeat.value);
    if (data.light.apply) setLight(data.light.value);
  };

  const applySop = (data: SopAdvisePayload) => {
    const next = data.gates
      .filter((g) => g.apply)
      .map((g) => ({ id: g.id, checked: false }));
    if (next.length) setGates(next);
  };

  const adoptAll = () => {
    if (suggestion) {
      setCategory(suggestion.category.value);
      setSeverity(suggestion.severity.value);
      setOwnerSeat(suggestion.ownerSeat.value);
      setLight(suggestion.light.value);
    }
    if (sopAdvice) {
      setGates(sopAdvice.gates.filter((g) => g.probability >= 0.45).map((g) => ({ id: g.id, checked: false })));
    }
  };

  const runSuggest = async () => {
    const suggestUrl = eventsSuggestUrl();
    const adviseUrl = eventsSopAdviseUrl();
    if ((!suggestUrl && !adviseUrl) || !title.trim()) return;
    setSuggesting(true);
    setSuggestError(null);
    try {
      const payload = { title: title.trim(), description: description.trim() };
      const [suggestRes, adviseRes] = await Promise.all([
        suggestUrl
          ? parseAuthResponse(
              await fetch(suggestUrl, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(payload),
              }),
            )
          : null,
        adviseUrl
          ? parseAuthResponse(
              await fetch(adviseUrl, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(payload),
              }),
            )
          : null,
      ]);

      if (suggestRes) {
        const body = (await suggestRes.json().catch(() => null)) as SuggestPayload | { error?: string } | null;
        if (!suggestRes.ok) {
          setSuggestError((body && "error" in body && body.error) || "智能建议失败");
        } else {
          const data = body as SuggestPayload;
          setSuggestion(data);
          applySuggestion(data);
        }
      }

      if (adviseRes) {
        const body = (await adviseRes.json().catch(() => null)) as SopAdvisePayload | { error?: string } | null;
        if (!adviseRes.ok) {
          setSuggestError((prev) => prev || (body && "error" in body && body.error) || "SOP 建议失败");
        } else {
          const data = body as SopAdvisePayload;
          setSopAdvice(data);
          applySop(data);
        }
      }
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
    const noteBits: string[] = [];
    if (sopAdvice) {
      noteBits.push(`SOP节奏：${SOP_CADENCE_LABEL[sopAdvice.cadence.value]}`);
      if (sopAdvice.sentiment.value !== "不适用") {
        noteBits.push(`舆情级：${sopAdvice.sentiment.value}（上报：${sopAdvice.reportSla.value}）`);
      }
      if (sopAdvice.escalateBajiang.apply) noteBits.push("建议八将议事/统一口径");
    }
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
      redLineGates: gates,
      status: "todo",
      notes: noteBits.length
        ? [
            {
              id: uid("note"),
              body: `Jev SOP 建议：${noteBits.join("；")}`,
              authorSeat: "系统",
              createdAt: nowIso(),
            },
          ]
        : [],
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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto border border-line bg-surface p-5"
      >
        <h3 className="text-[16px] font-medium">新建事件</h3>
        <p className="mt-1 text-[12px] text-mute">智能建议会预填字段，并挂接相关红线闸与 SOP 节奏。</p>
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
            {suggestion || sopAdvice ? (
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
            字段：{suggestion.category.value} · {suggestion.severity.value} · {suggestion.ownerSeat.value} ·{" "}
            {suggestion.light.value}灯
            {suggestion.needsHumanReview ? " · 建议人工核对字段" : ""}
          </p>
        ) : null}
        {sopAdvice ? (
          <p className="mt-1 text-[11px] leading-relaxed text-mute">
            SOP：{SOP_CADENCE_LABEL[sopAdvice.cadence.value]}（{confidenceLabel(sopAdvice.cadence.confidence)}）
            {sopAdvice.sentiment.value !== "不适用"
              ? ` · 舆情${sopAdvice.sentiment.value}/${sopAdvice.reportSla.value}`
              : ""}
            {sopAdvice.escalateBajiang.apply ? " · 建议八将议事" : ""}
            {gates.length ? ` · 挂闸 ${gates.map((g) => g.id).join(" ")}` : ""}
            {sopAdvice.needsHumanReview ? " · 闸口建议人工核对" : ""}
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
