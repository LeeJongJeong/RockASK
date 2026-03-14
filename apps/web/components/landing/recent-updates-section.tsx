import type { RecentUpdate } from "@rockask/types";
import Link from "next/link";

import { SectionEmptyState } from "@/components/landing/section-empty-state";
import { appRoutes, documentDetailRoute } from "@/lib/routes";

export function RecentUpdatesSection({ recentUpdates }: { recentUpdates: RecentUpdate[] }) {
  return (
    <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">최근 업데이트</h2>
          <p className="mt-1 text-sm text-slate-500">반영 직후 확인 가치가 높은 최신 변경 문서</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Live</span>
      </div>

      {recentUpdates.length === 0 ? (
        <div className="mt-5">
          <SectionEmptyState
            title="최근 반영된 업데이트가 없습니다."
            description="새로운 수집 또는 문서 변경이 반영되면 이 영역에 최신 업데이트가 표시됩니다."
            actionHref={appRoutes.ingestion}
            actionLabel="수집 파이프라인 보기"
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {recentUpdates.map((item) => (
            <Link
              key={item.id}
              href={documentDetailRoute(item.id)}
              className="block rounded-2xl border border-slate-200 p-4 transition hover:border-blue-500 hover:bg-blue-50/40"
            >
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.team} · {item.updatedRelative} · {item.visibility}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
