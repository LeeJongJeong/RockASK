import {
  AppInfoList,
  AppPill,
  AppScreenShell,
  AppSectionCard,
} from "@/components/app-screen-shell";
import { NewChatWorkspace } from "@/components/new-chat-workspace";
import {
  type DashboardPageSearchParams,
  formatCount,
  loadDashboardPageData,
} from "@/lib/route-page-data";
import { appRoutes } from "@/lib/routes";

interface NewChatPageProps {
  searchParams?: Promise<DashboardPageSearchParams>;
}

export default async function NewChatPage({ searchParams }: NewChatPageProps) {
  const { dashboard, fixture } = await loadDashboardPageData(searchParams);
  const enabledScopes = dashboard.scopes.filter((scope) => scope.enabled);

  const sidebar = (
    <>
      <AppSectionCard
        title="현재 질문 컨텍스트"
        description="대시보드와 동일한 범위/문서 상태를 사용합니다."
      >
        <AppInfoList
          items={[
            { label: "사용 가능한 범위", value: `${formatCount(enabledScopes.length)}개` },
            {
              label: "추천 프롬프트",
              value: `${formatCount(dashboard.recommendedPrompts.length)}개`,
            },
            { label: "최근 참조 문서", value: `${formatCount(dashboard.recentUpdates.length)}건` },
          ]}
        />
        {fixture === "empty" ? (
          <div className="mt-4">
            <AppPill tone="amber">empty fixture 기반으로 미리보기 중</AppPill>
          </div>
        ) : null}
      </AppSectionCard>

      <AppSectionCard
        title="질문을 잘 시작하는 방법"
        description="짧아도 충분하지만, 아래 세 가지를 넣으면 답변 품질이 더 좋아집니다."
      >
        <ul className="space-y-3 text-sm leading-6 text-slate-600">
          <li>1. 알고 싶은 결과 형태를 먼저 적습니다. 예: 표, 체크리스트, 3줄 요약</li>
          <li>2. 필요한 범위를 함께 지정합니다. 예: 인사 규정, 개발 문서, 내 문서만</li>
          <li>3. 최신 문서 기준이 필요한지 적습니다. 예: 이번 분기, 최신 승인본 기준</li>
        </ul>
      </AppSectionCard>
    </>
  );

  return (
    <AppScreenShell
      eyebrow="질문 워크스페이스"
      title="새 질문을 바로 시작하세요"
      description="검색어를 흩어 넣는 대신 필요한 결과를 문장으로 적어 보세요. 권한 범위에 맞는 문서만 골라 출처와 함께 답변합니다."
      breadcrumbs={[
        { href: appRoutes.home, label: "홈" },
        { href: appRoutes.chats, label: "채팅" },
        { label: "새 질문" },
      ]}
      actions={[
        { href: appRoutes.home, label: "대시보드로 돌아가기", tone: "secondary" },
        { href: appRoutes.chats, label: "최근 채팅 보기", tone: "primary" },
      ]}
      sidebar={sidebar}
    >
      <AppSectionCard
        title="질문 작성"
        description="질문을 입력하고 검색 범위를 고른 뒤 바로 채팅으로 이동할 수 있습니다."
      >
        <NewChatWorkspace scopes={dashboard.scopes} prompts={dashboard.recommendedPrompts} />
      </AppSectionCard>

      <AppSectionCard
        title="지금 자주 시작하는 질문"
        description="홈 화면에서 많이 쓰는 주제를 이 화면에서도 바로 이어서 시작할 수 있습니다."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dashboard.recommendedPrompts.map((prompt) => (
            <article
              key={prompt.id}
              className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5"
            >
              <p className="text-sm font-semibold text-slate-900">{prompt.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{prompt.prompt}</p>
            </article>
          ))}
        </div>
      </AppSectionCard>
    </AppScreenShell>
  );
}
