"use client";

import { useState } from "react";
import Link from "next/link";
import { GLOBAL_GATES, OWNER_SEATS, SEAT_META } from "@/lib/constants";
import { useRiskStore } from "@/lib/store";
import type { GateId, Light, OwnerSeat, Risk } from "@/lib/types";
import { LightBadge, SeatBadge, SeverityBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";

function gateLight(linked: Risk[]): Light {
  const open = linked.filter((r) => r.status !== "closed").filter((r) =>
    r.redLineGates.some((g) => !g.checked),
  );
  if (open.some((r) => r.light === "红" || r.severity === "P0")) return "红";
  if (open.length > 0) return "黄";
  if (linked.length > 0 && open.length === 0) return "绿";
  return "灰";
}

export default function GatesPage() {
  const { risks, ready } = useRiskStore();
  const [seat, setSeat] = useState<OwnerSeat | "">("");

  const rows = GLOBAL_GATES.map((gate) => {
    const linked = risks.filter((r) => r.redLineGates.some((g) => g.id === gate.id));
    const violators = linked.filter(
      (r) => r.status !== "closed" && r.redLineGates.some((g) => g.id === gate.id && !g.checked),
    );
    return { gate, linked, violators, light: gateLight(linked) };
  }).filter((row) => !seat || row.gate.enforcingSeats.includes(seat));

  const red = rows.filter((r) => r.light === "红").length;
  const yellow = rows.filter((r) => r.light === "黄").length;
  const green = rows.filter((r) => r.light === "绿").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
      <h1 className="text-xl font-semibold">红线闸总览</h1>
      <p className="mt-2 text-sm text-mute">
        九条硬闸，按执法席标注。未勾选且未关闭的关联风险会把闸口打成红/黄。
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <SeatChip active={seat === ""} onClick={() => setSeat("")} label="全部席位" />
        {OWNER_SEATS.map((item) => (
          <SeatChip
            key={item}
            active={seat === item}
            onClick={() => setSeat(item)}
            label={`${item} · ${SEAT_META[item].role}`}
          />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Score label="红闸" value={red} className="text-signal-red" />
        <Score label="黄闸" value={yellow} className="text-signal-amber" />
        <Score label="已过闸" value={green} className="text-signal-green" />
      </div>

      {!ready ? <p className="mt-8 text-sm text-mute">加载闸口状态…</p> : null}

      <ol className="mt-8 space-y-4">
        {rows.map(({ gate, linked, violators, light }) => (
          <li key={gate.id} className="rounded-2xl border border-line bg-panel p-5">
            <div className="flex flex-wrap items-start gap-3">
              <span className="font-mono text-sm text-gold">G{gate.index}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold leading-snug">{gate.title}</h2>
                  <LightBadge light={light} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {gate.enforcingSeats.map((enforcer) => (
                    <SeatBadge key={enforcer} seat={enforcer} />
                  ))}
                  <span className="self-center text-[11px] text-mute">主责执法席</span>
                </div>
                <p className="mt-2 text-sm text-mute">{gate.detail}</p>
              </div>
            </div>

            {violators.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {violators.map((risk) => (
                  <GateRiskRow key={risk.id} risk={risk} gateId={gate.id} />
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-xs text-mute">
                {linked.length === 0
                  ? "暂无卡片挂接此闸。可在风险详情中勾选关联。"
                  : "关联卡片均已勾选或已关闭。"}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function SeatChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs",
        active ? "border-gold/50 bg-gold/15 text-gold" : "border-line text-mute hover:text-paper",
      )}
    >
      {label}
    </button>
  );
}

function Score({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="text-xs text-mute">{label}</p>
      <p className={`mt-1 font-mono text-2xl ${className}`}>{value}</p>
    </div>
  );
}

function GateRiskRow({ risk, gateId }: { risk: Risk; gateId: GateId }) {
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl bg-ink/50 px-3 py-2 text-sm">
      <Link href={`/risk/${encodeURIComponent(risk.id)}`} className="font-mono text-gold hover:underline">
        {risk.id}
      </Link>
      <Link href={`/risk/${encodeURIComponent(risk.id)}`} className="hover:text-gold">
        {risk.title}
      </Link>
      <SeverityBadge severity={risk.severity} />
      <SeatBadge seat={risk.ownerSeat} />
      <span className="text-xs text-mute">{gateId} 未勾选</span>
    </li>
  );
}
