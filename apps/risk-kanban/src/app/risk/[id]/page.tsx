"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { CategoryChip, LightBadge, SeatBadge, SeverityBadge } from "@/components/Badges";
import { CATEGORIES, GLOBAL_GATES, LIGHTS, OWNER_SEATS } from "@/lib/constants";
import { COLUMNS, COLUMN_META } from "@/lib/types";
import type { CardGate, Category, GateId, Light, OwnerSeat, Risk, Severity } from "@/lib/types";
import { useRiskStore } from "@/lib/store";
import { formatDateTime, nowIso, uid } from "@/lib/utils";

export default function RiskDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const { risks, ready, upsert } = useRiskStore();
  const risk = risks.find((item) => item.id === id);

  if (!ready) {
    return <p className="px-6 py-16 text-sm text-mute">加载风险卡片…</p>;
  }
  if (!risk) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">未找到 {id}</p>
        <p className="mt-2 text-sm text-mute">可能尚未种子化，或编号已被重置。</p>
        <Link href="/" className="mt-6 inline-block text-gold hover:underline">
          返回看板
        </Link>
      </div>
    );
  }

  return <RiskEditor key={risk.id + risk.updatedAt} risk={risk} onSave={upsert} />;
}

function RiskEditor({
  risk,
  onSave,
}: {
  risk: Risk;
  onSave: (risk: Risk) => Promise<void>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Risk>(risk);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(risk), [draft, risk]);

  const patch = <K extends keyof Risk>(key: K, value: Risk[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleGate = (id: GateId) => {
    setDraft((prev) => {
      const exists = prev.redLineGates.find((g) => g.id === id);
      const redLineGates: CardGate[] = exists
        ? prev.redLineGates.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g))
        : [...prev.redLineGates, { id, checked: true }];
      return { ...prev, redLineGates };
    });
  };

  const addTrigger = (value: string) => {
    const next = value.trim();
    if (!next) return;
    patch("triggers", [...draft.triggers, next]);
  };

  const save = async () => {
    setSaving(true);
    await onSave({ ...draft, updatedAt: nowIso() });
    setSaving(false);
  };

  const addNote = async () => {
    const body = note.trim();
    if (!body) return;
    const next: Risk = {
      ...draft,
      notes: [
        {
          id: uid("note"),
          body,
          authorSeat: draft.ownerSeat,
          createdAt: nowIso(),
        },
        ...draft.notes,
      ],
      updatedAt: nowIso(),
    };
    setDraft(next);
    setNote("");
    await onSave(next);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1 text-sm text-mute hover:text-paper"
        >
          <ArrowLeft className="h-4 w-4" />
          看板
        </button>
        <span className="font-mono text-gold">{draft.id}</span>
        <SeverityBadge severity={draft.severity} />
        <LightBadge light={draft.light} />
        <SeatBadge seat={draft.ownerSeat} />
        <CategoryChip category={draft.category} />
        {dirty ? <span className="text-xs text-amber-200">未保存</span> : null}
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="ml-auto rounded-xl bg-gold px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-panel p-5">
            <label className="text-xs text-mute">标题</label>
            <input
              value={draft.title}
              onChange={(e) => patch("title", e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 text-lg font-semibold outline-none focus:border-gold/50"
            />
            <label className="mt-4 block text-xs text-mute">描述</label>
            <textarea
              value={draft.description}
              onChange={(e) => patch("description", e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none focus:border-gold/50"
            />
            <label className="mt-4 block text-xs text-mute">残余风险</label>
            <textarea
              value={draft.residualRisk}
              onChange={(e) => patch("residualRisk", e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none focus:border-gold/50"
            />
          </section>

          <section className="rounded-2xl border border-line bg-panel p-5">
            <h2 className="text-sm font-semibold">触发条件</h2>
            <ul className="mt-3 space-y-2">
              {draft.triggers.map((t, i) => (
                <li key={`${t}-${i}`} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  <span className="flex-1">{t}</span>
                  <button
                    type="button"
                    className="text-xs text-mute hover:text-signal-red"
                    onClick={() => patch("triggers", draft.triggers.filter((_, idx) => idx !== i))}
                  >
                    删除
                  </button>
                </li>
              ))}
            </ul>
            <TriggerInput onAdd={addTrigger} />
          </section>

          <section className="rounded-2xl border border-line bg-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">红线闸（本卡相关）</h2>
              <Link href="/gates" className="text-xs text-gold hover:underline">
                查看全局闸口
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {GLOBAL_GATES.map((gate) => {
                const current = draft.redLineGates.find((g) => g.id === gate.id);
                const attached = Boolean(current);
                const checked = Boolean(current?.checked);
                return (
                  <li key={gate.id} className="rounded-xl bg-ink/40 px-3 py-2">
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (!attached) {
                            patch("redLineGates", [...draft.redLineGates, { id: gate.id, checked: true }]);
                          } else {
                            toggleGate(gate.id);
                          }
                        }}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-mono text-xs text-gold">{gate.id}</span> {gate.title}
                        <span className="mt-1 block text-xs text-mute">{gate.detail}</span>
                      </span>
                    </label>
                    {attached ? (
                      <button
                        type="button"
                        className="ml-7 mt-1 text-[11px] text-mute hover:text-paper"
                        onClick={() =>
                          patch(
                            "redLineGates",
                            draft.redLineGates.filter((g) => g.id !== gate.id),
                          )
                        }
                      >
                        从本卡移除挂接
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ml-7 mt-1 text-[11px] text-mute hover:text-gold"
                        onClick={() =>
                          patch("redLineGates", [...draft.redLineGates, { id: gate.id, checked: false }])
                        }
                      >
                        挂到本卡（未过闸）
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-panel p-5">
            <h2 className="text-sm font-semibold">备注</h2>
            <div className="mt-3 flex gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="进展、证据、需要正将拍板的点…"
                className="flex-1 rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none focus:border-gold/50"
              />
              <button
                type="button"
                onClick={() => void addNote()}
                className="self-stretch rounded-xl border border-line px-3 text-sm text-gold hover:bg-gold/10"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {draft.notes.length === 0 ? (
                <li className="text-xs text-mute">还没有备注。</li>
              ) : (
                draft.notes.map((item) => (
                  <li key={item.id} className="rounded-xl bg-ink/40 px-3 py-2">
                    <div className="flex items-center gap-2 text-[11px] text-mute">
                      <span>{item.authorSeat}</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{item.body}</p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-20">
          <section className="rounded-2xl border border-line bg-panel p-4">
            <h2 className="text-sm font-semibold">状态移动</h2>
            <div className="mt-3 grid gap-2">
              {COLUMNS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={async () => {
                    const light: Light =
                      col === "closed" ? "绿" : col === "blocked" ? "红" : col === "watch" ? "黄" : draft.light;
                    const next = { ...draft, status: col, light, updatedAt: nowIso() };
                    setDraft(next);
                    await onSave(next);
                  }}
                  className={`rounded-xl border px-3 py-2 text-left text-sm ${
                    draft.status === col
                      ? "border-gold/50 bg-gold/15 text-gold"
                      : "border-line text-mute hover:text-paper"
                  }`}
                >
                  {COLUMN_META[col].label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-panel p-4 space-y-3">
            <Field label="分类">
              <select
                value={draft.category}
                onChange={(e) => patch("category", e.target.value as Category)}
                className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="等级">
              <select
                value={draft.severity}
                onChange={(e) => patch("severity", e.target.value as Severity)}
                className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm"
              >
                {["P0", "P1", "P2"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="灯色">
              <select
                value={draft.light}
                onChange={(e) => patch("light", e.target.value as Light)}
                className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm"
              >
                {LIGHTS.map((c) => (
                  <option key={c} value={c}>
                    {c}灯
                  </option>
                ))}
              </select>
            </Field>
            <Field label="责任席位">
              <select
                value={draft.ownerSeat}
                onChange={(e) => patch("ownerSeat", e.target.value as OwnerSeat)}
                className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm"
              >
                {OWNER_SEATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <p className="text-[11px] text-mute">更新于 {formatDateTime(draft.updatedAt)}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-mute">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TriggerInput({ onAdd }: { onAdd: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="mt-3 flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd(value);
            setValue("");
          }
        }}
        placeholder="添加触发条件，回车确认"
        className="flex-1 rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none focus:border-gold/50"
      />
      <button
        type="button"
        onClick={() => {
          onAdd(value);
          setValue("");
        }}
        className="rounded-xl border border-line px-3 text-sm text-mute hover:text-paper"
      >
        添加
      </button>
    </div>
  );
}
