import { LIGHT_META } from "@/lib/constants";
import type { Light, OwnerSeat, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    <span className={cn("border border-line px-1.5 py-0.5 text-[12px]", collab ? "text-mute" : "text-ink")}>
      {collab ? `共主 ${seat}` : seat}
    </span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  return <span className="text-[12px] text-mute">{category}</span>;
}
