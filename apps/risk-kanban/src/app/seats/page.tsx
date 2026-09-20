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
      <h1 className="text-[16px] font-medium">席位仪表盘</h1>
      <p className="mt-2 text-[13px] text-mute">
        正将、提将、风将、谣将、反将、火将、脱将、除将。点「看本席」切到按席位看板。
      </p>

      {!ready ? <p className="mt-8 text-[13px] text-mute">加载席位…</p> : null}

      <div className="mt-6 grid border-l border-t border-line md:grid-cols-2 xl:grid-cols-4">
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
    <section className="border-b border-r border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-medium">{seat}</h2>
          <p className="text-[12px] text-mute">{meta.role}</p>
          <p className="mt-1 text-[13px] text-ink">{meta.duty}</p>
        </div>
        <Link
          href="/"
          onClick={onFocus}
          className="shrink-0 border border-line px-2 py-1 text-[12px] text-mute hover:border-ink hover:text-ink"
        >
          看本席
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-[12px]">
        <Mini label="红" value={red} warn={red > 0} />
        <Mini label="黄" value={yellow} warn={yellow > 0} />
        <Mini label="待排查" value={todo} />
        <Mini label="阻断" value={blocked} warn={blocked > 0} />
      </div>

      <h3 className="mt-4 text-[12px] text-mute">在办 P0</h3>
      {topP0.length === 0 ? (
        <p className="mt-2 text-[12px] text-mute">本席暂无在办 P0。</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {topP0.map((risk) => (
            <li key={risk.id}>
              <Link
                href={`/risk/${encodeURIComponent(risk.id)}`}
                className="flex flex-wrap items-center gap-2 border border-transparent px-0 py-1 text-[13px] hover:underline"
              >
                <span className="font-mono text-[12px] text-mute">{risk.id}</span>
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
    <div>
      <p className="text-[11px] text-mute">{label}</p>
      <p className={cn("font-mono text-[16px]", warn ? "text-signal-red" : "text-ink")}>{value}</p>
    </div>
  );
}
