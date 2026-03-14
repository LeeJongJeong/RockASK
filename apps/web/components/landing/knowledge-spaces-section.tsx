import type { KnowledgeSpaceStatus, KnowledgeSpaceSummary } from "@rockask/types";
import Link from "next/link";

import { SectionEmptyState } from "@/components/landing/section-empty-state";
import { formatKnowledgeSpaceStatus } from "@/lib/dashboard-formatters";
import { appRoutes, knowledgeSpaceDetailRoute } from "@/lib/routes";

const knowledgeSpaceStyles: Record<KnowledgeSpaceStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  indexing: "bg-blue-100 text-blue-700",
  error: "bg-rose-100 text-rose-700",
  archived: "bg-slate-200 text-slate-700",
};

export function KnowledgeSpacesSection({
  knowledgeSpaces,
}: {
  knowledgeSpaces: KnowledgeSpaceSummary[];
}) {
  return (
    <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">주요 지식 공간</h2>
          <p className="mt-1 text-sm text-slate-500">업무별로 가장 많이 접근하는 컬렉션 상태</p>
        </div>
        <Link href={appRoutes.knowledgeSpaces} className="text-sm font-medium text-blue-700">
          전체 보기
        </Link>
      </div>

      {knowledgeSpaces.length === 0 ? (
        <div className="mt-5">
          <SectionEmptyState
            title="표시할 지식 공간이 없습니다."
            description="팀별 컬렉션이 아직 연결되지 않았습니다. 지식 공간 목록에서 컬렉션을 추가하거나 문서를 업로드해 주세요."
            actionHref={appRoutes.knowledgeSpaces}
            actionLabel="지식 공간 보기"
          />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {knowledgeSpaces.map((space) => (
            <Link
              key={space.id}
              href={knowledgeSpaceDetailRoute(space.id)}
              className="block rounded-3xl border border-slate-200 p-5 transition hover:border-blue-500 hover:bg-blue-50/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{space.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    문서 {space.docCount}개 · 소유 팀: {space.ownerTeam} · 마지막 업데이트{" "}
                    {space.lastUpdatedRelative}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${knowledgeSpaceStyles[space.status]}`}
                >
                  {formatKnowledgeSpaceStatus(space.status)}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">공개 범위</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{space.visibility}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">상태</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {formatKnowledgeSpaceStatus(space.status)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">문의 담당</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{space.contactName}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
