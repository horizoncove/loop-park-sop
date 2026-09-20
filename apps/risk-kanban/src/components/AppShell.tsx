"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { APP_NAME, APP_SUBTITLE } from "@/lib/constants";
import { RiskProvider, useRiskStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "看板" },
  { href: "/seats", label: "席位" },
  { href: "/gates", label: "红线闸" },
  { href: "/sop", label: "SOP 节奏" },
];

function Header() {
  const pathname = usePathname();
  const { risks, persistError, resetSeed } = useRiskStore();
  const red = risks.filter((r) => r.light === "红").length;
  const blocked = risks.filter((r) => r.status === "blocked").length;
  const p0 = risks.filter((r) => r.severity === "P0" && r.status !== "closed").length;

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-4 py-3 lg:px-6">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 via-amber-400 to-emerald-400 shadow-[0_0_20px_rgba(240,180,41,0.25)]">
            <ShieldAlert className="h-5 w-5 text-ink" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-wide text-paper">
              {APP_NAME}
            </span>
            <span className="block truncate text-[11px] text-mute">{APP_SUBTITLE}</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition",
                  active ? "bg-gold/20 text-gold" : "text-mute hover:text-paper",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 text-xs text-mute md:flex">
          <Stat label="红灯" value={red} warn={red > 0} />
          <Stat label="阻断" value={blocked} warn={blocked > 0} />
          <Stat label="在办 P0" value={p0} warn={p0 > 0} />
          <button
            type="button"
            onClick={() => {
              if (confirm("恢复种子数据？当前看板与备注会被覆盖。")) {
                void resetSeed();
              }
            }}
            className="rounded-full border border-line px-3 py-1.5 text-mute hover:border-gold/40 hover:text-gold"
          >
            重置种子
          </button>
        </div>
      </div>
      {persistError ? (
        <div className="border-t border-amber-500/20 bg-amber-400/10 px-4 py-1.5 text-center text-xs text-amber-200">
          {persistError}
        </div>
      ) : null}
    </header>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1">
      <span>{label}</span>
      <span className={cn("font-mono", warn ? "text-signal-red" : "text-paper")}>{value}</span>
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RiskProvider>
      <Header />
      <main className="flex-1">{children}</main>
    </RiskProvider>
  );
}
