"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Risk } from "@/lib/types";
import { SEAT_SWATCH } from "@/lib/constants";
import { riskHref } from "@/lib/paths";
import { LightBadge, SeatBadge } from "./Badges";

export function RiskCard({
  risk,
  overlay = false,
  dragging = false,
  hideOwner = false,
}: {
  risk: Risk;
  overlay?: boolean;
  dragging?: boolean;
  hideOwner?: boolean;
}) {
  return (
    <article
      className={`border border-line bg-surface p-3 ${overlay ? "border-ink" : "hover:border-ink/40"}`}
      style={{ borderLeft: `4px solid ${SEAT_SWATCH[risk.ownerSeat]}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-mute">{risk.id}</span>
        <LightBadge light={risk.light} />
      </div>
      <Link
        href={riskHref(risk.id)}
        className="mt-2 block"
        draggable={false}
        onClick={(event) => {
          if (dragging) event.preventDefault();
        }}
      >
        <h3 className="text-[16px] font-medium leading-snug text-ink hover:underline">{risk.title}</h3>
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {!hideOwner ? <SeatBadge seat={risk.ownerSeat} /> : null}
        {(risk.collabSeats ?? []).map((seat) => (
          <SeatBadge key={seat} seat={seat} collab />
        ))}
        <span className="font-mono text-[11px] text-mute">{risk.severity}</span>
      </div>
    </article>
  );
}

export function SortableRiskCard({ risk, hideOwner }: { risk: Risk; hideOwner?: boolean }) {
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
      <RiskCard risk={risk} dragging={isDragging} hideOwner={hideOwner} />
    </div>
  );
}
