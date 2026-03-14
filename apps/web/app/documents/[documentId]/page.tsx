import Link from "next/link";

import {
  AppEmptyState,
  AppInfoList,
  AppScreenShell,
  AppSectionCard,
} from "@/components/app-screen-shell";
import { type DashboardPageSearchParams, loadDocumentDetailPageData } from "@/lib/route-page-data";
import { appRoutes } from "@/lib/routes";

interface DocumentDetailPageProps {
  params: Promise<{
    documentId: string;
  }>;
  searchParams?: Promise<DashboardPageSearchParams>;
}

export default async function DocumentDetailPage({
  params,
  searchParams,
}: DocumentDetailPageProps) {
  const { documentId } = await params;
  const { detail } = await loadDocumentDetailPageData(documentId, searchParams);

  if (!detail) {
    return (
      <AppScreenShell
        eyebrow="문서 상세"
        title="찾는 문서가 없습니다"
        description="최근 업데이트 목록에 없거나 현재 권한에서 접근할 수 없는 문서입니다."
        breadcrumbs={[
          { href: appRoutes.home, label: "홈" },
          { href: appRoutes.knowledgeSpaces, label: "지식 공간" },
          { label: documentId },
        ]}
        actions={[
          { href: appRoutes.knowledgeSpaces, label: "지식 공간으로", tone: "primary" },
          { href: appRoutes.documentUpload, label: "문서 업로드", tone: "secondary" },
        ]}
      >
        <AppEmptyState
          title="이 문서를 열 수 없습니다"
          description="문서 ID를 다시 확인하거나 최근 업데이트 목록에서 다시 진입해 주세요."
          action={{ href: appRoutes.home, label: "홈으로 이동", tone: "primary" }}
        />
      </AppScreenShell>
    );
  }

  const sidebar = (
    <>
      <AppSectionCard
        title="문서 메타데이터"
        description="현재 문서의 소유, 공개 범위, 최신 상태를 보여 줍니다."
      >
        <AppInfoList items={detail.metadata} />
      </AppSectionCard>

      <AppSectionCard title="관련 화면" description="이 문서와 함께 자주 보는 공간이나 대화입니다.">
        {detail.relatedLinks.length === 0 ? (
          <p className="text-sm leading-6 text-slate-500">연결된 화면이 아직 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {detail.relatedLinks.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="block rounded-3xl border border-slate-200 bg-slate-50/90 p-4 transition hover:border-blue-300 hover:bg-white"
              >
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.hint}</p>
              </Link>
            ))}
          </div>
        )}
      </AppSectionCard>
    </>
  );

  return (
    <AppScreenShell
      eyebrow="문서 상세"
      title={detail.document.title}
      description="문서의 핵심 변경점과 함께, 이 문서를 바탕으로 어떤 질문을 던지면 좋은지까지 확인할 수 있는 화면입니다."
      breadcrumbs={[
        { href: appRoutes.home, label: "홈" },
        { href: appRoutes.knowledgeSpaces, label: "지식 공간" },
        { label: detail.document.title },
      ]}
      actions={[
        { href: appRoutes.newChat, label: "이 문서로 질문 시작", tone: "primary" },
        { href: appRoutes.knowledgeSpaces, label: "지식 공간", tone: "secondary" },
      ]}
      sidebar={sidebar}
    >
      <AppSectionCard
        title="문서 개요"
        description="이 문서가 어떤 상황에서 쓰이는지 먼저 짚습니다."
      >
        <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-5 text-base leading-7 text-slate-700">
          {detail.overview}
        </div>
      </AppSectionCard>

      <AppSectionCard
        title="이번 문서의 핵심 변경점"
        description="짧게 훑어봐도 맥락을 이해할 수 있도록 주요 포인트만 추렸습니다."
      >
        <div className="space-y-3">
          {detail.highlights.map((highlight) => (
            <div
              key={highlight}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700"
            >
              {highlight}
            </div>
          ))}
        </div>
      </AppSectionCard>

      <AppSectionCard
        title="이 문서로 바로 물어볼 질문"
        description="검색창에 붙여 넣기 좋은 문장으로 정리했습니다."
      >
        <div className="space-y-3">
          {detail.recommendedQuestions.map((question) => (
            <div
              key={question}
              className="rounded-3xl border border-blue-100 bg-blue-50/80 px-4 py-4 text-sm leading-6 text-blue-900"
            >
              {question}
            </div>
          ))}
        </div>
      </AppSectionCard>
    </AppScreenShell>
  );
}
