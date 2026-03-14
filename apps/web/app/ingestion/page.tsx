import Link from "next/link";

import {
  AppMetricGrid,
  AppPill,
  AppScreenShell,
  AppSectionCard,
} from "@/components/app-screen-shell";
import {
  type DashboardPageSearchParams,
  formatCount,
  ingestionStages,
  loadDashboardPageData,
} from "@/lib/route-page-data";
import { appRoutes } from "@/lib/routes";

interface IngestionPageProps {
  searchParams?: Promise<DashboardPageSearchParams>;
}

export default async function IngestionPage({ searchParams }: IngestionPageProps) {
  const { dashboard } = await loadDashboardPageData(searchParams);

  const sidebar = (
    <>
      <AppSectionCard title="현재 알림" description="파이프라인 점검 전에 확인할 운영 알림입니다.">
        {dashboard.alerts.length === 0 ? (
          <p className="text-sm leading-6 text-slate-500">지금은 확인할 긴급 알림이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {dashboard.alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-3xl border border-amber-100 bg-amber-50/90 p-4"
              >
                <div className="flex items-center gap-2">
                  <AppPill tone="amber">{alert.severity}</AppPill>
                  <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{alert.body}</p>
              </div>
            ))}
          </div>
        )}
      </AppSectionCard>

      <AppSectionCard title="연결 화면" description="수집 상태를 본 뒤 자주 넘어가는 라우트입니다.">
        <div className="space-y-3">
          <Link
            href={appRoutes.documentUpload}
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            <span>문서 업로드</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href={appRoutes.knowledgeSpaces}
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            <span>지식 공간</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </AppSectionCard>
    </>
  );

  return (
    <AppScreenShell
      eyebrow="수집 파이프라인"
      title="문서 수집과 색인 흐름을 한 눈에 보는 운영 화면"
      description="문서가 들어오고, 정제되고, 색인되고, 실제 질의에 노출되기까지의 상태를 운영 관점에서 정리한 화면입니다."
      breadcrumbs={[{ href: appRoutes.home, label: "홈" }, { label: "수집 파이프라인" }]}
      actions={[
        { href: appRoutes.documentUpload, label: "문서 업로드", tone: "primary" },
        { href: appRoutes.home, label: "대시보드", tone: "secondary" },
      ]}
      sidebar={sidebar}
    >
      <AppMetricGrid
        items={[
          {
            label: "오늘 색인된 문서",
            value: `${formatCount(dashboard.health.indexedToday)}건`,
            hint: "현재 대시보드 기준 집계",
          },
          {
            label: "대기 중 작업",
            value: `${formatCount(dashboard.health.pendingIndexJobs)}건`,
            hint: "색인 대기 큐",
          },
          {
            label: "실패 작업",
            value: `${formatCount(dashboard.health.failedIngestionJobs)}건`,
            hint: "재시도 필요 건수",
          },
        ]}
      />

      <AppSectionCard
        title="파이프라인 단계"
        description="운영자가 상태를 읽을 때 필요한 최소 흐름만 정리했습니다."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ingestionStages.map((stage, index) => (
            <article
              key={stage.title}
              className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5"
            >
              <AppPill tone="blue">0{index + 1}</AppPill>
              <h2 className="mt-3 text-base font-semibold text-slate-900">{stage.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{stage.description}</p>
            </article>
          ))}
        </div>
      </AppSectionCard>

      <AppSectionCard
        title="최근 색인 대상 문서"
        description="최근 업데이트 문서가 실제 운영 흐름에서는 어떤 입력으로 보이는지 예시를 보여 줍니다."
      >
        <div className="space-y-3">
          {dashboard.recentUpdates.map((document) => (
            <div
              key={document.id}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{document.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{document.summary}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{document.team}</p>
                  <p className="mt-1">{document.updatedRelative}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AppSectionCard>
    </AppScreenShell>
  );
}
