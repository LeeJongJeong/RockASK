import Link from "next/link";

import {
  AppEmptyState,
  AppMetricGrid,
  AppPill,
  AppScreenShell,
  AppSectionCard,
} from "@/components/app-screen-shell";
import {
  type DashboardPageSearchParams,
  getChatDetailPageData,
  loadDashboardPageData,
} from "@/lib/route-page-data";
import { appRoutes } from "@/lib/routes";

interface ChatDetailPageProps {
  params: Promise<{
    chatId: string;
  }>;
  searchParams?: Promise<DashboardPageSearchParams>;
}

export default async function ChatDetailPage({ params, searchParams }: ChatDetailPageProps) {
  const { chatId } = await params;
  const { dashboard } = await loadDashboardPageData(searchParams);
  const detail = getChatDetailPageData(dashboard, chatId);

  if (!detail) {
    return (
      <AppScreenShell
        eyebrow="채팅 상세"
        title="찾는 채팅이 없습니다"
        description="최근 채팅 목록에 없는 항목이거나 현재 권한에서 볼 수 없는 대화입니다."
        breadcrumbs={[
          { href: appRoutes.home, label: "홈" },
          { href: appRoutes.chats, label: "채팅" },
          { label: chatId },
        ]}
        actions={[
          { href: appRoutes.chats, label: "최근 채팅으로", tone: "primary" },
          { href: appRoutes.newChat, label: "새 질문 시작", tone: "secondary" },
        ]}
      >
        <AppEmptyState
          title="이 채팅을 열 수 없습니다"
          description="권한 범위를 다시 확인하거나 홈 화면의 최근 채팅 목록에서 다시 진입해 주세요."
          action={{ href: appRoutes.chats, label: "채팅 목록 보기", tone: "primary" }}
        />
      </AppScreenShell>
    );
  }

  const sidebar = (
    <>
      <AppSectionCard title="참조 문서" description="이 대화에서 함께 본 문서와 공간입니다.">
        {detail.sources.length === 0 ? (
          <p className="text-sm leading-6 text-slate-500">연결된 참조 문서가 아직 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {detail.sources.map((source) => (
              <Link
                key={`${source.href}-${source.label}`}
                href={source.href}
                className="block rounded-3xl border border-slate-200 bg-slate-50/90 p-4 transition hover:border-blue-300 hover:bg-white"
              >
                <p className="text-sm font-semibold text-slate-900">{source.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{source.hint}</p>
              </Link>
            ))}
          </div>
        )}
      </AppSectionCard>

      <AppSectionCard
        title="다음에 바로 물어볼 질문"
        description="같은 문맥을 이어가기 좋은 후속 질문입니다."
      >
        <div className="space-y-3">
          {detail.followUps.map((question) => (
            <div
              key={question}
              className="rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm leading-6 text-slate-700"
            >
              {question}
            </div>
          ))}
        </div>
      </AppSectionCard>
    </>
  );

  return (
    <AppScreenShell
      eyebrow="채팅 상세"
      title={detail.chat.title}
      description="검색 결과가 어떤 대화 흐름으로 이어졌는지, 어떤 문서를 근거로 답했는지 한 화면에서 다시 확인할 수 있습니다."
      breadcrumbs={[
        { href: appRoutes.home, label: "홈" },
        { href: appRoutes.chats, label: "채팅" },
        { label: detail.chat.title },
      ]}
      actions={[
        { href: appRoutes.newChat, label: "새 질문 시작", tone: "primary" },
        { href: appRoutes.chats, label: "목록으로", tone: "secondary" },
      ]}
      sidebar={sidebar}
    >
      <AppMetricGrid items={detail.metrics} />

      <AppSectionCard title="답변 요약" description="이 대화에서 핵심으로 남긴 답변 포인트입니다.">
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50/90 p-5">
          <AppPill tone="blue">{detail.chat.assistantName}</AppPill>
          <p className="text-base leading-7 text-slate-700">{detail.summary}</p>
          <p className="rounded-3xl border border-blue-100 bg-blue-50/80 px-4 py-4 text-sm leading-6 text-blue-900">
            {detail.answerSnapshot}
          </p>
        </div>
      </AppSectionCard>

      <AppSectionCard
        title="대화 흐름"
        description="사용자 질문과 답변이 오간 순서를 그대로 보여 줍니다."
      >
        <div className="space-y-4">
          {detail.transcript.map((item) => (
            <article
              key={`${item.role}-${item.content}`}
              className={`max-w-3xl rounded-[28px] border px-5 py-4 ${
                item.role === "assistant"
                  ? "border-blue-100 bg-blue-50/80"
                  : "ml-auto border-slate-200 bg-slate-50/90"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <AppPill tone={item.role === "assistant" ? "blue" : "slate"}>
                  {item.role === "assistant" ? detail.chat.assistantName : "사용자"}
                </AppPill>
                {item.note ? <span className="text-xs text-slate-400">{item.note}</span> : null}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">{item.content}</p>
            </article>
          ))}
        </div>
      </AppSectionCard>
    </AppScreenShell>
  );
}
