import Link from "next/link";

import {
  AppEmptyState,
  AppInfoList,
  AppPill,
  AppScreenShell,
  AppSectionCard,
} from "@/components/app-screen-shell";
import {
  type DashboardPageSearchParams,
  formatCount,
  loadKnowledgeSpacesPageData,
} from "@/lib/route-page-data";
import { appRoutes } from "@/lib/routes";

const knowledgeSpaceTone = {
  active: "emerald",
  indexing: "blue",
  error: "rose",
  archived: "slate",
} as const;

const knowledgeSpaceLabel = {
  active: "운영 중",
  indexing: "색인 중",
  error: "오류",
  archived: "보관",
} as const;

interface KnowledgeSpacesPageProps {
  searchParams?: Promise<DashboardPageSearchParams>;
}

export default async function KnowledgeSpacesPage({ searchParams }: KnowledgeSpacesPageProps) {
  const { dashboard, spaces } = await loadKnowledgeSpacesPageData(searchParams);
  const activeSpaces = spaces.filter((space) => space.status === "active").length;
  const indexingSpaces = spaces.filter((space) => space.status === "indexing").length;
  const totalDocuments = spaces.reduce((sum, space) => sum + space.docCount, 0);

  const sidebar = (
    <>
      <AppSectionCard title="공간 운영 현황" description="지식 공간 상태와 문서 규모를 요약합니다.">
        <AppInfoList
          items={[
            { label: "운영 중 공간", value: `${formatCount(activeSpaces)}개` },
            { label: "색인 중 공간", value: `${formatCount(indexingSpaces)}개` },
            { label: "노출 문서 수", value: `${formatCount(totalDocuments)}건` },
          ]}
        />
      </AppSectionCard>

      <AppSectionCard
        title="자주 함께 보는 화면"
        description="공간 상세를 보기 전후로 자주 이동하는 라우트입니다."
      >
        <div className="space-y-3">
          <Link
            href={appRoutes.documentUpload}
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            <span>문서 업로드</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href={appRoutes.ingestion}
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            <span>수집 파이프라인</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </AppSectionCard>
    </>
  );

  return (
    <AppScreenShell
      eyebrow="지식 공간"
      title="팀별 지식 공간과 운영 상태"
      description="어떤 팀이 어떤 문서를 관리하는지, 최근에 무엇이 갱신됐는지, 색인 상태가 어떤지 한 화면에서 확인할 수 있습니다."
      breadcrumbs={[{ href: appRoutes.home, label: "홈" }, { label: "지식 공간" }]}
      actions={[
        { href: appRoutes.documentUpload, label: "문서 업로드", tone: "primary" },
        { href: appRoutes.home, label: "대시보드", tone: "secondary" },
      ]}
      sidebar={sidebar}
    >
      <AppSectionCard
        title="지식 공간 목록"
        description="Landing에서 보던 주요 공간을 더 자세한 운영 정보와 함께 확인할 수 있습니다."
      >
        {spaces.length === 0 ? (
          <AppEmptyState
            title="표시할 지식 공간이 없습니다"
            description="문서가 수집되면 이 화면에 팀별 공간과 운영 상태가 표시됩니다."
            action={{ href: appRoutes.documentUpload, label: "문서 업로드 시작", tone: "primary" }}
          />
        ) : (
          <div className="space-y-4">
            {spaces.map((space) => (
              <Link
                key={space.id}
                href={appRoutes.knowledgeSpaceDetail(space.id)}
                className="block rounded-[28px] border border-slate-200 bg-slate-50/90 p-5 transition hover:border-blue-300 hover:bg-white"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{space.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {space.ownerTeam} 운영 · 문서 {formatCount(space.docCount)}건 · 최근 갱신{" "}
                      {space.lastUpdatedRelative}
                    </p>
                  </div>
                  <AppPill tone={knowledgeSpaceTone[space.status]}>
                    {knowledgeSpaceLabel[space.status]}
                  </AppPill>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">공개 범위</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{space.visibility}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">문의 담당</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{space.contactName}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">상태</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {knowledgeSpaceLabel[space.status]}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </AppSectionCard>

      <AppSectionCard
        title="최근 문서 업데이트"
        description="지식 공간과 함께 자주 보는 최근 변경 문서입니다."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dashboard.recentUpdates.map((document) => (
            <Link
              key={document.id}
              href={appRoutes.documentDetail(document.id)}
              className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:bg-slate-50/80"
            >
              <p className="text-sm font-semibold text-slate-900">{document.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{document.summary}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>{document.team}</span>
                <span>{document.updatedRelative}</span>
              </div>
            </Link>
          ))}
        </div>
      </AppSectionCard>
    </AppScreenShell>
  );
}
