import { LIGHT_META, SEAT_SWATCH } from "@/lib/constants";
import type { Light, OwnerSeat, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SeatSwatch({
  seat,
  size = "sm",
}: {
  seat: OwnerSeat;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-4 w-4" : size === "md" ? "h-3.5 w-3.5" : "h-2.5 w-2.5";
  return (
    <span
      className={cn("inline-block shrink-0", dim)}
      style={{ background: SEAT_SWATCH[seat] }}
      aria-hidden
    />
  );
}

export function LightDot({ light, size = "md" }: { light: Light; size?: "sm" | "md" }) {
  const meta = LIGHT_META[light];
  return (
    <span
      className={cn("inline-block shrink-0", size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5", meta.dot)}
      title={meta.label}
    />
  );
}

export function LightBadge({ light }: { light: Light }) {
  const meta = LIGHT_META[light];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-[12px]",
        meta.className,
      )}
    >
      <LightDot light={light} size="sm" />
      {light}灯
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, string> = {
    P0: "text-signal-red",
    P1: "text-signal-amber",
    P2: "text-mute",
  };
  return (
    <span className={cn("font-mono text-[11px] tracking-wide", map[severity])}>{severity}</span>
  );
}

export function SeatBadge({ seat, collab = false }: { seat: OwnerSeat; collab?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-line px-1.5 py-0.5 text-[12px]",
        collab ? "text-mute" : "text-ink",
      )}
      style={{ background: `color-mix(in oklab, ${SEAT_SWATCH[seat]} 12%, #ffffff)` }}
    >
      <SeatSwatch seat={seat} />
      {collab ? `共主 ${seat}` : seat}
    </span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  return <span className="text-[12px] text-mute">{category}</span>;
}
