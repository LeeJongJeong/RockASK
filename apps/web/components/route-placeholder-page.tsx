import Link from "next/link";

import { appRoutes } from "@/lib/routes";

interface RoutePlaceholderPageProps {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
}

export function RoutePlaceholderPage({
  title,
  description,
  primaryLabel = "대시보드로 돌아가기",
  primaryHref = appRoutes.home,
}: RoutePlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_26%),linear-gradient(180deg,#f8fbff_0%,#f1f5f9_100%)] px-6 py-12 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200/70 bg-white/90 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">RockASK</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            {primaryLabel}
          </Link>
          <Link
            href={appRoutes.home}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </main>
  );
}
