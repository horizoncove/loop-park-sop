import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const noto = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-noto",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jet",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LOOP 事件看板",
  description: "LOOP PARK 事件看板 — 按红黄绿灰灯性分级的运营台",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${noto.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg font-sans text-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
