import Link from "next/link";

import {
  AppInfoList,
  AppPill,
  AppScreenShell,
  AppSectionCard,
} from "@/components/app-screen-shell";
import {
  type DashboardPageSearchParams,
  formatCount,
  loadDashboardPageData,
  uploadSourceOptions,
} from "@/lib/route-page-data";
import { appRoutes } from "@/lib/routes";

interface DocumentUploadPageProps {
  searchParams?: Promise<DashboardPageSearchParams>;
}

export default async function DocumentUploadPage({ searchParams }: DocumentUploadPageProps) {
  const { dashboard } = await loadDashboardPageData(searchParams);

  const sidebar = (
    <>
      <AppSectionCard
        title="현재 수집 상태"
        description="문서 업로드 전에 현재 파이프라인 상태를 함께 확인할 수 있습니다."
      >
        <AppInfoList
          items={[
            { label: "오늘 색인된 문서", value: `${formatCount(dashboard.health.indexedToday)}건` },
            { label: "대기 중 작업", value: `${formatCount(dashboard.health.pendingIndexJobs)}건` },
            {
              label: "실패한 수집",
              value: `${formatCount(dashboard.health.failedIngestionJobs)}건`,
            },
          ]}
        />
      </AppSectionCard>

      <AppSectionCard title="다음 단계" description="업로드 이후 바로 이어서 확인하는 화면입니다.">
        <div className="space-y-3">
          <Link
            href={appRoutes.ingestion}
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            <span>수집 파이프라인 열기</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href={appRoutes.knowledgeSpaces}
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            <span>지식 공간 보기</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </AppSectionCard>
    </>
  );

  return (
    <AppScreenShell
      eyebrow="문서 업로드"
      title="새 문서를 수집 파이프라인으로 보낼 준비"
      description="문서 업로드 자체보다 중요한 건 메타데이터와 권한 정보입니다. 어떤 공간에 들어가야 하는지, 누가 볼 수 있는지 먼저 정리하는 화면입니다."
      breadcrumbs={[{ href: appRoutes.home, label: "홈" }, { label: "문서 업로드" }]}
      actions={[
        { href: appRoutes.ingestion, label: "수집 상태 보기", tone: "primary" },
        { href: appRoutes.home, label: "대시보드", tone: "secondary" },
      ]}
      sidebar={sidebar}
    >
      <AppSectionCard
        title="지원하는 수집 방식"
        description="현재 화면에서 확인할 수 있는 기본 업로드/연동 시나리오입니다."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {uploadSourceOptions.map((option) => (
            <article
              key={option.title}
              className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5"
            >
              <AppPill tone="blue">수집 옵션</AppPill>
              <h2 className="mt-3 text-base font-semibold text-slate-900">{option.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{option.description}</p>
            </article>
          ))}
        </div>
      </AppSectionCard>

      <AppSectionCard
        title="업로드 요청 시 필요한 정보"
        description="API가 붙기 전에도 입력 구조와 검수 항목을 미리 확인할 수 있도록 정리했습니다."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
            <span className="text-sm font-semibold text-slate-700">문서 제목</span>
            <input
              type="text"
              defaultValue="예: 보안 점검 체크리스트 v4 초안"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            />
          </label>
          <label className="block rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
            <span className="text-sm font-semibold text-slate-700">소유 팀</span>
            <input
              type="text"
              defaultValue="예: 보안팀"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            />
          </label>
          <label className="block rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
            <span className="text-sm font-semibold text-slate-700">공개 범위</span>
            <select className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              <option>전사 공개</option>
              <option>팀 공개</option>
              <option>제한 공개</option>
            </select>
          </label>
          <label className="block rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
            <span className="text-sm font-semibold text-slate-700">연결할 지식 공간</span>
            <select className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              {dashboard.knowledgeSpaces.map((space) => (
                <option key={space.id}>{space.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 rounded-[28px] border border-blue-100 bg-blue-50/80 p-5 text-sm leading-6 text-blue-900">
          실제 업로드 실행은 다음 단계에서 API와 연결되지만, 이 화면에서 메타데이터 구조와 검수
          포인트를 먼저 확정할 수 있습니다.
        </div>
      </AppSectionCard>
    </AppScreenShell>
  );
}
