import Link from "next/link";

import {
  AppInfoList,
  AppPill,
  AppScreenShell,
  AppSectionCard,
} from "@/components/app-screen-shell";
import {
  assistantCatalog,
  type DashboardPageSearchParams,
  loadDashboardPageData,
} from "@/lib/route-page-data";
import { appRoutes } from "@/lib/routes";

interface AssistantsPageProps {
  searchParams?: Promise<DashboardPageSearchParams>;
}

export default async function AssistantsPage({ searchParams }: AssistantsPageProps) {
  const { dashboard } = await loadDashboardPageData(searchParams);

  const sidebar = (
    <>
      <AppSectionCard
        title="현재 연결 범위"
        description="어시스턴트가 주로 참조하는 지식 범주입니다."
      >
        <AppInfoList
          items={dashboard.scopes
            .filter((scope) => scope.enabled)
            .map((scope) => ({
              label: scope.label,
              value: scope.isDefault ? "기본 범위" : "선택 가능",
            }))}
        />
      </AppSectionCard>

      <AppSectionCard
        title="바로 시작"
        description="어시스턴트 소개를 본 뒤 바로 질문으로 넘어갈 수 있습니다."
      >
        <div className="space-y-3">
          <Link
            href={appRoutes.newChat}
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            <span>새 질문 시작</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href={appRoutes.chats}
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            <span>최근 채팅 보기</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </AppSectionCard>
    </>
  );

  return (
    <AppScreenShell
      eyebrow="어시스턴트"
      title="무엇을 잘하는지 먼저 보고 고르는 어시스턴트 목록"
      description="정책, 기술, 브리핑처럼 자주 쓰는 질문 패턴별로 어떤 어시스턴트를 쓰면 좋은지 정리한 화면입니다."
      breadcrumbs={[{ href: appRoutes.home, label: "홈" }, { label: "어시스턴트" }]}
      actions={[
        { href: appRoutes.newChat, label: "바로 질문하기", tone: "primary" },
        { href: appRoutes.home, label: "대시보드", tone: "secondary" },
      ]}
      sidebar={sidebar}
    >
      <AppSectionCard
        title="어시스턴트 카탈로그"
        description="현재 랜딩 화면에서 자주 연결되는 역할 중심 어시스턴트입니다."
      >
        <div className="space-y-4">
          {assistantCatalog.map((assistant) => (
            <article
              key={assistant.id}
              className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{assistant.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{assistant.description}</p>
                </div>
                <AppPill tone="blue">추천</AppPill>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {assistant.strengths.map((strength) => (
                  <div
                    key={strength}
                    className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700"
                  >
                    {strength}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                연결 범위: {assistant.coverage}
              </div>
            </article>
          ))}
        </div>
      </AppSectionCard>
    </AppScreenShell>
  );
}
