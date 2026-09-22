import { Suspense } from "react";
import { RiskDetailClient } from "./RiskDetailClient";

export const dynamic = "force-static";

export default function RiskDetailPage() {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-[13px] text-mute">加载事件…</p>}>
      <RiskDetailClient />
    </Suspense>
  );
}
