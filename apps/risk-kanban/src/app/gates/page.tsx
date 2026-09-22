"use client";

import { useState } from "react";
import Link from "next/link";
import { GLOBAL_GATES, OWNER_SEATS, SEAT_META } from "@/lib/constants";
import { useRiskStore } from "@/lib/store";
import type { GateId, Light, OwnerSeat, Risk } from "@/lib/types";
import { LightBadge, SeatBadge, SeverityBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";
import { riskHref } from "@/lib/paths";

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[16px] font-medium">红线闸总览</h1>
          <p className="mt-2 text-[13px] text-mute">九条硬闸。未勾选且未关闭的关联事件会把闸口打成红/黄。</p>
        </div>
        <select
          value={seat}
          onChange={(e) => setSeat(e.target.value as OwnerSeat | "")}
          className="border border-line bg-surface px-2 py-1.5 text-[13px]"
        >
          <option value="">全部席位</option>
          {OWNER_SEATS.map((item) => (
            <option key={item} value={item}>
              {item} · {SEAT_META[item].role}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 grid grid-cols-3 border border-line">
        <Score label="红闸" value={red} className="text-signal-red" />
        <Score label="黄闸" value={yellow} className="text-signal-amber border-l border-line" />
        <Score label="已过闸" value={green} className="text-signal-green border-l border-line" />
      </div>

      {!ready ? <p className="mt-8 text-[13px] text-mute">加载闸口状态…</p> : null}

      <ol className="mt-6 divide-y divide-line border border-line bg-surface">
        {rows.map(({ gate, linked, violators, light }) => (
          <li key={gate.id} className="p-4">
            <div className="flex flex-wrap items-start gap-3">
              <span className="font-mono text-[13px] text-mute">G{gate.index}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[16px] font-medium leading-snug">{gate.title}</h2>
                  <LightBadge light={light} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {gate.enforcingSeats.map((enforcer) => (
                    <SeatBadge key={enforcer} seat={enforcer} />
                  ))}
                  <span className="text-[12px] text-mute">主责执法席</span>
                </div>
                <p className="mt-2 text-[13px] text-mute">{gate.detail}</p>
              </div>
            </div>

            {violators.length > 0 ? (
              <ul className="mt-4 space-y-1">
                {violators.map((risk) => (
                  <GateRiskRow key={risk.id} risk={risk} gateId={gate.id} />
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[12px] text-mute">
                {linked.length === 0
                  ? "暂无事件挂接此闸。可在事件详情中勾选关联。"
                  : "关联卡片均已勾选或已关闭。"}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Score({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={cn("bg-surface px-4 py-3", className)}>
      <p className="text-[12px] text-mute">{label}</p>
      <p className="mt-1 font-mono text-[22px]">{value}</p>
    </div>
  );
}

function GateRiskRow({ risk, gateId }: { risk: Risk; gateId: GateId }) {
  return (
    <li className="flex flex-wrap items-center gap-2 py-1 text-[13px]">
      <Link href={riskHref(risk.id)} className="font-mono text-[12px] text-mute hover:underline">
        {risk.id}
      </Link>
      <Link href={riskHref(risk.id)} className="hover:underline">
        {risk.title}
      </Link>
      <SeverityBadge severity={risk.severity} />
      <SeatBadge seat={risk.ownerSeat} />
      <span className="text-[12px] text-mute">{gateId} 未勾选</span>
    </li>
  );
}
