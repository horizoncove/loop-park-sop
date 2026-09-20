import { LIGHT_META, SEAT_META } from "@/lib/constants";
import type { Light, OwnerSeat, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LightDot({ light, size = "md" }: { light: Light; size?: "sm" | "md" }) {
  const meta = LIGHT_META[light];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
        meta.dot,
        meta.glow,
      )}
      title={meta.label}
    />
  );
}

export function LightBadge({ light }: { light: Light }) {
  const meta = LIGHT_META[light];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
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
    P0: "bg-red-500/20 text-red-300 border-red-500/30",
    P1: "bg-amber-400/15 text-amber-200 border-amber-400/30",
    P2: "bg-stone-400/10 text-stone-300 border-stone-500/30",
  };
  return (
    <span className={cn("rounded-md border px-1.5 py-0.5 font-mono text-[11px] tracking-wide", map[severity])}>
      {severity}
    </span>
  );
}

export function SeatBadge({ seat, collab = false }: { seat: OwnerSeat; collab?: boolean }) {
  const tone: Record<string, string> = {
    gold: "bg-amber-300/10 text-gold border-amber-300/25",
    blue: "bg-blue-400/10 text-blue-200 border-blue-400/25",
    sky: "bg-sky-400/10 text-sky-200 border-sky-400/25",
    violet: "bg-violet-400/10 text-violet-200 border-violet-400/25",
    rose: "bg-rose-400/10 text-rose-200 border-rose-400/25",
    orange: "bg-orange-400/10 text-orange-200 border-orange-400/25",
    lime: "bg-lime-400/10 text-lime-200 border-lime-400/25",
    teal: "bg-teal-400/10 text-teal-200 border-teal-400/25",
  };
  const meta = SEAT_META[seat];
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", tone[meta.tone])}>
      {collab ? `共主·${seat}` : seat}
    </span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  return (
    <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-mute">
      {category}
    </span>
  );
}
