"use client";

import { useState } from "react";
import { APP_NAME, APP_SUBTITLE, OWNER_SEATS, SEAT_META, SEAT_SWATCH, seatBand } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import type { OwnerSeat } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const { login } = useAuth();
  const [seat, setSeat] = useState<OwnerSeat>("反将");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const message = await login(seat, password);
    setBusy(false);
    if (message) setError(message);
  };

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-lg border border-line bg-surface p-6">
        <p className="text-[12px] text-mute">{APP_SUBTITLE}</p>
        <h1 className="mt-1 text-[20px] font-medium tracking-tight">{APP_NAME}</h1>
        <p className="mt-2 text-[13px] text-mute">以八将席位登录。口令由服务端配置，不是个人账号体系。</p>

        <p className="mt-5 text-[12px] text-mute">选择席位</p>
        <div className="mt-2 grid grid-cols-4 gap-0 border-l border-t border-line">
          {OWNER_SEATS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSeat(item)}
              className={cn(
                "border-b border-r border-line px-2 py-3 text-left",
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

        <label className="mt-5 block text-[12px] text-mute">
          {seat}口令
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none"
            required
          />
        </label>

        {error ? <p className="mt-3 text-[13px] text-signal-red">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full border border-ink bg-ink px-4 py-2.5 text-[13px] font-medium text-bg disabled:opacity-60"
        >
          {busy ? "登录中…" : `以${seat}进入`}
        </button>
      </form>
    </div>
  );
}
