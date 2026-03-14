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
  formatLatency,
  loadDashboardPageData,
} from "@/lib/route-page-data";
import { appRoutes } from "@/lib/routes";

interface ChatsPageProps {
  searchParams?: Promise<DashboardPageSearchParams>;
}

export default async function ChatsPage({ searchParams }: ChatsPageProps) {
  const { dashboard } = await loadDashboardPageData(searchParams);

  const sidebar = (
    <>
      <AppSectionCard
        title="오늘 대화 상태"
        description="최근 채팅과 홈 대시보드 요약 값을 함께 보여 줍니다."
      >
        <AppInfoList
          items={[
            { label: "오늘 질문 수", value: `${formatCount(dashboard.summary.queriesToday)}건` },
            { label: "최근 채팅", value: `${formatCount(dashboard.recentChats.length)}건` },
            { label: "평균 응답 시간", value: formatLatency(dashboard.summary.avgResponseTimeMs) },
          ]}
        />
      </AppSectionCard>

      <AppSectionCard
        title="바로 이동"
        description="대화를 이어가기 전에 자주 함께 보는 화면입니다."
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
      eyebrow="채팅 히스토리"
      title="최근 대화와 이어서 볼 질문 흐름"
      description="대시보드에서 바로 들어온 질문과 최근 다시 열어본 대화를 한 화면에서 관리합니다. 필요한 대화를 골라 바로 이어서 볼 수 있습니다."
      breadcrumbs={[{ href: appRoutes.home, label: "홈" }, { label: "채팅" }]}
      actions={[
        { href: appRoutes.newChat, label: "새 질문 시작", tone: "primary" },
        { href: appRoutes.home, label: "대시보드", tone: "secondary" },
      ]}
      sidebar={sidebar}
    >
      <AppSectionCard
        title="최근 채팅"
        description="Landing에서 열었던 질문을 그대로 이어서 볼 수 있습니다."
      >
        {dashboard.recentChats.length === 0 ? (
          <AppEmptyState
            title="아직 최근 채팅이 없습니다"
            description="첫 질문을 시작하면 이 화면에 최근 대화가 쌓입니다."
            action={{ href: appRoutes.newChat, label: "새 질문 시작", tone: "primary" }}
          />
        ) : (
          <div className="space-y-4">
            {dashboard.recentChats.map((chat) => (
              <Link
                key={chat.id}
                href={appRoutes.chatDetail(chat.id)}
                className="block rounded-[28px] border border-slate-200 bg-slate-50/90 p-5 transition hover:border-blue-300 hover:bg-white"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{chat.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      최근 응답 시각은 {chat.lastMessageRelative}이며, {chat.assistantName} 기준으로
                      이어집니다.
                    </p>
                  </div>
                  <AppPill tone="blue">{chat.assistantName}</AppPill>
                </div>
              </Link>
            ))}
          </div>
        )}
      </AppSectionCard>

      <AppSectionCard
        title="질문 패턴 힌트"
        description="최근 대화와 비슷하게 다시 묻기 좋은 주제를 정리했습니다."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dashboard.recommendedPrompts.map((prompt) => (
            <article key={prompt.id} className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">{prompt.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{prompt.prompt}</p>
            </article>
          ))}
        </div>
      </AppSectionCard>
    </AppScreenShell>
  );
}
