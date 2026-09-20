"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, APP_SUBTITLE } from "@/lib/constants";
import { RiskProvider, useRiskStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BoardViewToggle } from "./BoardFilters";

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
  const yellow = risks.filter((r) => r.light === "黄").length;
  const gray = risks.filter((r) => r.light === "灰").length;
  const home = pathname === "/";

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

        <div className="ml-auto hidden items-center gap-4 text-[12px] text-mute md:flex">
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
          <button
            type="button"
            onClick={() => {
              if (confirm("恢复种子数据？当前看板与备注会被覆盖。")) {
                void resetSeed();
              }
            }}
            className="border border-line px-2 py-1 text-mute hover:border-ink hover:text-ink"
          >
            重置种子
          </button>
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

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RiskProvider>
      <Header />
      <main className="flex-1">{children}</main>
    </RiskProvider>
  );
}
