"use client";

import Link from "next/link";
import { OWNER_SEATS, SEAT_META } from "@/lib/constants";
import { useRiskStore } from "@/lib/store";
import type { OwnerSeat, Risk } from "@/lib/types";
import { LightBadge, SeatBadge, SeverityBadge } from "@/components/Badges";
import { belongsToSeat, cn } from "@/lib/utils";

export default function SeatsPage() {
  const { risks, ready, setBoardView, setMySeat, setMineOnly } = useRiskStore();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      <h1 className="text-xl font-semibold">席位仪表盘</h1>
      <p className="mt-2 text-sm text-mute">
        千门八将分列八席：正将、提将、风将、谣将、反将、火将、脱将、除将。点席位可切到「按席位」看板并打开「只看我的席」。
      </p>

      {!ready ? <p className="mt-8 text-sm text-mute">加载席位…</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {OWNER_SEATS.map((seat) => (
          <SeatCard
            key={seat}
            seat={seat}
            risks={risks}
            onFocus={() => {
              setMySeat(seat);
              setMineOnly(true);
              setBoardView("seat");
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SeatCard({
  seat,
  risks,
  onFocus,
}: {
  seat: OwnerSeat;
  risks: Risk[];
  onFocus: () => void;
}) {
  const owned = risks.filter((risk) => belongsToSeat(risk, seat));
  const open = owned.filter((risk) => risk.status !== "closed");
  const red = open.filter((risk) => risk.light === "红").length;
  const yellow = open.filter((risk) => risk.light === "黄").length;
  const todo = open.filter((risk) => risk.status === "todo").length;
  const blocked = open.filter((risk) => risk.status === "blocked").length;
  const topP0 = open
    .filter((risk) => risk.severity === "P0")
    .slice()
    .sort((a, b) => Number(b.light === "红") - Number(a.light === "红"))
    .slice(0, 3);
  const meta = SEAT_META[seat];

  return (
    <section className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{seat}</h2>
          <p className="text-xs text-mute">{meta.role}</p>
          <p className="mt-1 text-sm text-paper/90">{meta.duty}</p>
        </div>
        <Link
          href="/"
          onClick={onFocus}
          className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-gold hover:border-gold/40"
        >
          看本席
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Mini label="红" value={red} warn={red > 0} />
        <Mini label="黄" value={yellow} warn={yellow > 0} />
        <Mini label="待排查" value={todo} />
        <Mini label="阻断" value={blocked} warn={blocked > 0} />
      </div>

      <h3 className="mt-4 text-xs text-mute">在办 P0</h3>
      {topP0.length === 0 ? (
        <p className="mt-2 text-xs text-mute">本席暂无在办 P0。</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {topP0.map((risk) => (
            <li key={risk.id}>
              <Link
                href={`/risk/${encodeURIComponent(risk.id)}`}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-ink/40 px-3 py-2 text-sm hover:bg-ink/70"
              >
                <span className="font-mono text-gold">{risk.id}</span>
                <span className="min-w-0 flex-1 truncate">{risk.title}</span>
                <SeverityBadge severity={risk.severity} />
                <LightBadge light={risk.light} />
                {risk.ownerSeat !== seat ? <SeatBadge seat={risk.ownerSeat} collab /> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Mini({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-ink/40 px-2 py-2">
      <p className="text-[11px] text-mute">{label}</p>
      <p className={cn("font-mono text-lg", warn ? "text-signal-red" : "text-paper")}>{value}</p>
    </div>
  );
}
