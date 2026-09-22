"use client";

import { useState } from "react";
import { APP_NAME, APP_SUBTITLE, OWNER_SEATS, SEAT_META, SEAT_SWATCH, seatBand } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import type { OwnerSeat } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const { login } = useAuth();
  const [seat, setSeat] = useState<OwnerSeat>("反将");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const enter = async (next: OwnerSeat) => {
    setSeat(next);
    setBusy(true);
    setError(null);
    const message = await login(next);
    setBusy(false);
    if (message) setError(message);
  };

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg border border-line bg-surface p-6">
        <p className="text-[12px] text-mute">{APP_SUBTITLE}</p>
        <h1 className="mt-1 text-[20px] font-medium tracking-tight">{APP_NAME}</h1>
        <p className="mt-2 text-[13px] text-mute">点选席位进入。无口令，只用来分角色显示。</p>

        <p className="mt-5 text-[12px] text-mute">选择席位</p>
        <div className="mt-2 grid grid-cols-4 gap-0 border-l border-t border-line">
          {OWNER_SEATS.map((item) => (
            <button
              key={item}
              type="button"
              disabled={busy}
              onClick={() => void enter(item)}
              className={cn(
                "border-b border-r border-line px-2 py-3 text-left disabled:opacity-60",
                seat === item ? "text-ink" : "text-mute hover:text-ink",
              )}
              style={{
                background: seat === item ? seatBand(item, 22) : "#fff",
                borderLeft: seat === item ? `4px solid ${SEAT_SWATCH[item]}` : undefined,
              }}
            >
              <span className="block text-[15px] font-medium">{item}</span>
              <span className="mt-1 block text-[11px] text-mute">{SEAT_META[item].role}</span>
            </button>
          ))}
        </div>

        {error ? <p className="mt-3 text-[13px] text-signal-red">{error}</p> : null}

        <p className="mt-5 text-[12px] text-mute">{busy ? "进入中…" : "点上方席位即可进入看板"}</p>
      </div>
    </div>
  );
}
