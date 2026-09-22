"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, APP_SUBTITLE, SEAT_META, SEAT_SWATCH } from "@/lib/constants";
import { AuthProvider, useAuth } from "@/lib/auth";
import { normalizePathname } from "@/lib/paths";
import { RiskProvider, useRiskStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BoardViewToggle } from "./BoardFilters";
import { LoginScreen } from "./LoginScreen";

const NAV = [
  { href: "/", label: "看板" },
  { href: "/seats", label: "席位" },
  { href: "/gates", label: "红线闸" },
  { href: "/sop", label: "SOP 节奏" },
];

function Header() {
  const pathname = normalizePathname(usePathname());
  const { risks, persistError, resetSeed, mySeat, seatLocked, isAdmin, logout } = useRiskStore();
  const red = risks.filter((r) => r.light === "红").length;
  const yellow = risks.filter((r) => r.light === "黄").length;
  const gray = risks.filter((r) => r.light === "灰").length;
  const home = pathname === "/";
  const canReset = isAdmin || !seatLocked;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4 lg:px-6">
        <Link href="/" className="min-w-0 shrink-0">
          <span className="block truncate text-[16px] font-medium tracking-tight text-ink">{APP_NAME}</span>
          <span className="block truncate text-[12px] text-mute">{APP_SUBTITLE}</span>
        </Link>

        <nav className="flex h-14 items-center gap-4 text-[13px]">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-14 items-center border-b",
                  active ? "border-ink text-ink" : "border-transparent text-mute hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {home ? <BoardViewToggle className="hidden sm:flex" /> : null}

        <div className="ml-auto flex items-center gap-3 text-[12px] text-mute">
          <div className="hidden items-center gap-4 md:flex">
            <span>
              红灯 <span className={cn("font-mono", red > 0 ? "text-signal-red" : "text-ink")}>{red}</span>
            </span>
            <span>
              黄灯{" "}
              <span className={cn("font-mono", yellow > 0 ? "text-signal-amber" : "text-ink")}>{yellow}</span>
            </span>
            <span>
              灰灯 <span className={cn("font-mono", gray > 0 ? "text-mute" : "text-ink")}>{gray}</span>
            </span>
          </div>
          {seatLocked ? (
            <span
              className="inline-flex items-center gap-2 border border-line px-2 py-1 text-ink"
              style={{ borderLeft: `4px solid ${SEAT_SWATCH[mySeat]}` }}
              title={SEAT_META[mySeat].duty}
            >
              {mySeat}
            </span>
          ) : null}
          {canReset ? (
            <button
              type="button"
              onClick={() => {
                if (confirm("恢复种子数据？当前看板与备注会被覆盖。")) {
                  void resetSeed();
                }
              }}
              className="hidden border border-line px-2 py-1 text-mute hover:border-ink hover:text-ink sm:inline"
            >
              重置种子
            </button>
          ) : null}
          {logout && seatLocked ? (
            <button
              type="button"
              onClick={logout}
              className="border border-line px-2 py-1 text-mute hover:border-ink hover:text-ink"
            >
              退出
            </button>
          ) : null}
        </div>
      </div>
      {persistError ? (
        <div className="border-t border-line bg-surface px-4 py-2 text-center text-[12px] text-signal-amber">
          {persistError}
        </div>
      ) : null}
    </header>
  );
}

function AuthedShell({ children }: { children: React.ReactNode }) {
  const { ready, loginRequired, session } = useAuth();
  if (!ready) {
    return <p className="px-6 py-16 text-[13px] text-mute">核对席位…</p>;
  }
  if (loginRequired && !session) {
    return <LoginScreen />;
  }
  return (
    <RiskProvider>
      <Header />
      <main className="flex-1">{children}</main>
    </RiskProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthedShell>{children}</AuthedShell>
    </AuthProvider>
  );
}
