import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-[16px] font-medium">没有这一页</p>
      <p className="mt-2 text-[13px] text-mute">静态部署下事件详情在 /risk?id=编号</p>
      <Link href="/" className="mt-6 inline-block text-[13px] hover:underline">
        返回看板
      </Link>
    </div>
  );
}
