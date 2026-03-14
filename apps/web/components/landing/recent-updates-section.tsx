import type { RecentUpdate } from "@rockask/types";
import Link from "next/link";
import { SectionEmptyState } from "@/components/landing/section-empty-state";
import { appRoutes } from "@/lib/routes";

export function RecentUpdatesSection({ items }: { items: RecentUpdate[] }) {
  return (
    <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">최근 업데이트</h2>
          <p className="mt-1 text-sm text-slate-500">반영 직후 확인할 가치가 큰 콘텐츠</p>
        </div>
        <span className="text-blue-600">↺</span>
      </div>
      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <SectionEmptyState
            title="최근 업데이트가 없습니다."
            description="새 문서가 반영되면 이 영역에서 바로 확인할 수 있습니다."
            actionLabel="문서 업로드"
            actionHref={appRoutes.documentUpload}
          />
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={appRoutes.documentDetail(item.id)}
              className="block rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.team} · {item.updatedRelative} · {item.visibility}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
