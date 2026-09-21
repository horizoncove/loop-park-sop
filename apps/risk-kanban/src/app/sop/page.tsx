"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { SeatBadge } from "@/components/Badges";
import { eventsSopReconcileUrl, riskHref } from "@/lib/paths";
import { authHeaders, parseAuthResponse } from "@/lib/session";
import { SOP_CADENCE_LABEL, SOP_SECTIONS, pct, type SopSectionId } from "@/lib/sop";
import { useRiskStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const SOP_KEY = "loop-park-sop-checks-v1";
const EMPTY = "{}";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("loop-sop-checks", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("loop-sop-checks", callback);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(SOP_KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function getServerSnapshot() {
  return EMPTY;
}

type Checks = Record<string, boolean>;

type ReconcilePayload = {
  enabled: boolean;
  focus: { value: SopSectionId; confidence: number; apply: boolean };
  sections: Array<{
    id: SopSectionId;
    coverage: number;
    backlogPressure: number;
    priorityEventIds: string[];
  }>;
  needsHumanReview: boolean;
  error?: string;
};

function itemKey(sectionId: string, index: number) {
  return `${sectionId}-${index}`;
}

export default function SopPage() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { risks, ready } = useRiskStore();
  const [reconciling, setReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [reconcile, setReconcile] = useState<ReconcilePayload | null>(null);
  const canReconcile = Boolean(eventsSopReconcileUrl());

  const checks = useMemo(() => {
    try {
      return JSON.parse(raw) as Checks;
    } catch {
      return {} as Checks;
    }
  }, [raw]);

  const openEvents = useMemo(
    () =>
      risks
        .filter((r) => r.status !== "closed")
        .filter((r) => r.light === "红" || r.light === "黄" || r.severity === "P0")
        .slice(0, 24),
    [risks],
  );

  const toggle = useCallback(
    (key: string) => {
      const next = { ...checks, [key]: !checks[key] };
      localStorage.setItem(SOP_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("loop-sop-checks"));
    },
    [checks],
  );

  const runReconcile = async () => {
    const url = eventsSopReconcileUrl();
    if (!url) return;
    setReconciling(true);
    setReconcileError(null);
    try {
      const res = await parseAuthResponse(
        await fetch(url, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            events: openEvents.map((r) => ({
              id: r.id,
              title: r.title,
              category: r.category,
              light: r.light,
              severity: r.severity,
              ownerSeat: r.ownerSeat,
              status: r.status,
            })),
          }),
        }),
      );
      const body = (await res.json().catch(() => null)) as ReconcilePayload | { error?: string } | null;
      if (!res.ok) {
        setReconcileError((body && "error" in body && body.error) || "对账失败");
        return;
      }
      setReconcile(body as ReconcilePayload);
    } catch {
      setReconcileError("网络异常，SOP 对账暂不可用");
    } finally {
      setReconciling(false);
    }
  };

  const sectionAdvice = (id: SopSectionId) => reconcile?.sections.find((s) => s.id === id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[16px] font-medium">SOP 节奏清单</h1>
          <p className="mt-2 text-[13px] text-mute">
            勾选保存在本机。正文仍以仓库
            <code className="mx-1 border border-line bg-surface px-1 text-[12px]">工作SOP/</code>
            与
            <code className="mx-1 border border-line bg-surface px-1 text-[12px]">舆情监测/</code>
            为准（不改 Markdown）。Jev 只对账看板开放事件与节奏缺口。
          </p>
        </div>
        {canReconcile ? (
          <button
            type="button"
            disabled={reconciling || !ready}
            onClick={() => void runReconcile()}
            className="inline-flex items-center gap-1 border border-ink px-3 py-2 text-[12px] text-ink disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {reconciling ? "对账中…" : `看板对账（${openEvents.length}）`}
          </button>
        ) : null}
      </div>

      {reconcileError ? <p className="mt-3 text-[12px] text-signal-red">{reconcileError}</p> : null}

      {reconcile ? (
        <div className="mt-5 border border-line bg-surface p-4">
          <p className="text-[13px] text-ink">
            本周优先盯：
            <span className="ml-1 font-medium">{SOP_CADENCE_LABEL[reconcile.focus.value]}</span>
            <span className="ml-2 font-mono text-[12px] text-mute">
              {pct(reconcile.focus.confidence)}
            </span>
            {reconcile.needsHumanReview ? (
              <span className="ml-2 text-[12px] text-signal-amber">建议人工扫一眼</span>
            ) : null}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {reconcile.sections.map((s) => (
              <li key={s.id} className="border border-line px-3 py-2 text-[12px] text-mute">
                <span className="text-ink">{SOP_CADENCE_LABEL[s.id]}</span>
                <span className="ml-2">覆盖 {pct(s.coverage)}</span>
                <span className="ml-2">积压 {pct(s.backlogPressure)}</span>
                {s.priorityEventIds[0] ? (
                  <Link href={riskHref(s.priorityEventIds[0])} className="ml-2 text-ink hover:underline">
                    {s.priorityEventIds[0]}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 space-y-0 border border-line bg-surface">
        {SOP_SECTIONS.map((section, index) => {
          const done = section.items.filter((_, i) => checks[itemKey(section.id, i)]).length;
          const advice = sectionAdvice(section.id);
          const focused = reconcile?.focus.value === section.id;
          return (
            <section
              key={section.id}
              className={cn("p-5", index > 0 ? "border-t border-line" : "", focused ? "bg-bg" : "")}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[16px] font-medium">
                  {section.title}
                  {focused ? <span className="ml-2 text-[12px] font-normal text-signal-amber">本周焦点</span> : null}
                </h2>
                <span className="font-mono text-[12px] text-mute">
                  {done}/{section.items.length}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-mute">来源：{section.source}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {section.seats.map((seat) => (
                  <SeatBadge key={seat} seat={seat} />
                ))}
              </div>
              {advice ? (
                <p className="mt-2 text-[12px] text-mute">
                  Jev 覆盖 {pct(advice.coverage)} · 积压 {pct(advice.backlogPressure)}
                  {advice.priorityEventIds[0] ? (
                    <>
                      {" · 优先 "}
                      <Link href={riskHref(advice.priorityEventIds[0])} className="text-ink hover:underline">
                        {advice.priorityEventIds[0]}
                      </Link>
                    </>
                  ) : null}
                </p>
              ) : null}
              <ul className="mt-4 space-y-1">
                {section.items.map((item, itemIndex) => {
                  const key = itemKey(section.id, itemIndex);
                  const on = Boolean(checks[key]);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className={cn(
                          "flex w-full items-start gap-3 px-0 py-2 text-left text-[14px]",
                          on ? "text-mute" : "text-ink",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border",
                            on ? "border-signal-green bg-signal-green text-bg" : "border-line",
                          )}
                        >
                          {on ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className={on ? "line-through" : ""}>{item}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
