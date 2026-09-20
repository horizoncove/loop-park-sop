"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Risk } from "@/lib/types";
import { formatRelative, openGateCount } from "@/lib/utils";
import { CategoryChip, LightDot, SeatBadge, SeverityBadge } from "./Badges";

export function RiskCard({
  risk,
  overlay = false,
  dragging = false,
}: {
  risk: Risk;
  overlay?: boolean;
  dragging?: boolean;
}) {
  const openGates = openGateCount(risk.redLineGates);
  const border =
    risk.light === "红"
      ? "border-l-signal-red"
      : risk.light === "黄"
        ? "border-l-signal-amber"
        : risk.light === "绿"
          ? "border-l-signal-green"
          : "border-l-stone-500";

  return (
    <article
      className={`rounded-xl border border-line border-l-4 bg-card p-3 shadow-sm transition hover:border-gold/30 hover:bg-card-2 ${border} ${
        overlay ? "rotate-1 shadow-2xl ring-1 ring-gold/30" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-mute/70" aria-hidden>
          <GripVertical className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-gold">{risk.id}</span>
            <SeverityBadge severity={risk.severity} />
            <span className="ml-auto">
              <LightDot light={risk.light} />
            </span>
          </div>
          <Link
            href={`/risk/${encodeURIComponent(risk.id)}`}
            className="mt-1 block"
            draggable={false}
            onClick={(event) => {
              if (dragging) event.preventDefault();
            }}
          >
            <h3 className="text-sm font-semibold leading-snug text-paper hover:text-gold">
              {risk.title}
            </h3>
          </Link>
          <p className="mt-1 line-clamp-2 text-xs text-mute">{risk.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <CategoryChip category={risk.category} />
            <SeatBadge seat={risk.ownerSeat} />
            {openGates > 0 ? (
              <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-[11px] text-red-300">
                未过闸 {openGates}
              </span>
            ) : null}
          </div>
          {risk.triggers[0] ? (
            <p className="mt-2 truncate text-[11px] text-mute/90">触发：{risk.triggers[0]}</p>
          ) : null}
          <p className="mt-2 text-[11px] text-mute/70">{formatRelative(risk.updatedAt)}</p>
        </div>
      </div>
    </article>
  );
}

export function SortableRiskCard({ risk }: { risk: Risk }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: risk.id,
    data: { type: "card", risk },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab touch-none active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <RiskCard risk={risk} dragging={isDragging} />
    </div>
  );
}
