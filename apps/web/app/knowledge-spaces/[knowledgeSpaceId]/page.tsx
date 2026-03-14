import Link from "next/link";

import {
  AppEmptyState,
  AppInfoList,
  AppMetricGrid,
  AppPill,
  AppScreenShell,
  AppSectionCard,
} from "@/components/app-screen-shell";
import {
  type DashboardPageSearchParams,
  loadKnowledgeSpaceDetailPageData,
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

interface KnowledgeSpaceDetailPageProps {
  params: Promise<{
    knowledgeSpaceId: string;
  }>;
  searchParams?: Promise<DashboardPageSearchParams>;
}

export default async function KnowledgeSpaceDetailPage({
  params,
  searchParams,
}: KnowledgeSpaceDetailPageProps) {
  const { knowledgeSpaceId } = await params;
  const { detail } = await loadKnowledgeSpaceDetailPageData(knowledgeSpaceId, searchParams);

  if (!detail) {
    return (
      <AppScreenShell
        eyebrow="지식 공간 상세"
        title="찾는 지식 공간이 없습니다"
        description="현재 권한으로 볼 수 없거나 대시보드에 아직 노출되지 않은 공간입니다."
        breadcrumbs={[
          { href: appRoutes.home, label: "홈" },
          { href: appRoutes.knowledgeSpaces, label: "지식 공간" },
          { label: knowledgeSpaceId },
        ]}
        actions={[
          { href: appRoutes.knowledgeSpaces, label: "공간 목록으로", tone: "primary" },
          { href: appRoutes.documentUpload, label: "문서 업로드", tone: "secondary" },
        ]}
      >
        <AppEmptyState
          title="이 공간을 열 수 없습니다"
          description="권한 범위나 최근 색인 상태를 확인한 뒤 다시 시도해 주세요."
          action={{ href: appRoutes.knowledgeSpaces, label: "지식 공간 보기", tone: "primary" }}
        />
      </AppScreenShell>
    );
  }

  const sidebar = (
    <>
      <AppSectionCard title="공간 정보" description="운영 정보와 접근 범위를 함께 확인합니다.">
        <AppInfoList
          items={[
            { label: "운영 팀", value: detail.space.ownerTeam },
            { label: "문의 담당", value: detail.space.contactName },
            { label: "공개 범위", value: detail.space.visibility },
            { label: "최근 갱신", value: detail.space.lastUpdatedRelative },
          ]}
        />
        <div className="mt-4">
          <AppPill tone={knowledgeSpaceTone[detail.space.status]}>
            {knowledgeSpaceLabel[detail.space.status]}
          </AppPill>
        </div>
      </AppSectionCard>

      <AppSectionCard
        title="연결 문서"
        description="이 공간을 이해할 때 함께 보면 좋은 문서입니다."
      >
        {detail.linkedDocuments.length === 0 ? (
          <p className="text-sm leading-6 text-slate-500">연결된 문서가 아직 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {detail.linkedDocuments.map((document) => (
              <Link
                key={`${document.href}-${document.label}`}
                href={document.href}
                className="block rounded-3xl border border-slate-200 bg-slate-50/90 p-4 transition hover:border-blue-300 hover:bg-white"
              >
                <p className="text-sm font-semibold text-slate-900">{document.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{document.hint}</p>
              </Link>
            ))}
          </div>
        )}
      </AppSectionCard>
    </>
  );

  return (
    <AppScreenShell
      eyebrow="지식 공간 상세"
      title={detail.space.name}
      description="문서가 어떤 기준으로 묶여 있고, 누가 관리하며, 어떤 질문에서 자주 쓰이는지까지 함께 정리한 화면입니다."
      breadcrumbs={[
        { href: appRoutes.home, label: "홈" },
        { href: appRoutes.knowledgeSpaces, label: "지식 공간" },
        { label: detail.space.name },
      ]}
      actions={[
        { href: appRoutes.documentUpload, label: "이 공간에 문서 추가", tone: "primary" },
        { href: appRoutes.knowledgeSpaces, label: "목록으로", tone: "secondary" },
      ]}
      sidebar={sidebar}
    >
      <AppMetricGrid items={detail.metrics} />

      <AppSectionCard
        title="공간 개요"
        description="이 공간이 어떤 문서를 위해 존재하는지 먼저 설명합니다."
      >
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50/90 p-5">
          <p className="text-base leading-7 text-slate-700">{detail.overview}</p>
          <p className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
            {detail.stewardship}
          </p>
        </div>
      </AppSectionCard>

      <AppSectionCard
        title="이 공간에서 다루는 주제"
        description="실제로 질문이 많이 붙는 범주를 기준으로 묶었습니다."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {detail.coverageTopics.map((topic) => (
            <div
              key={topic}
              className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-medium text-slate-700"
            >
              {topic}
            </div>
          ))}
        </div>
      </AppSectionCard>

      <AppSectionCard
        title="운영 원칙"
        description="문서 공개와 최신성 유지에 사용하는 기본 규칙입니다."
      >
        <div className="space-y-3">
          {detail.operatingRules.map((rule) => (
            <div
              key={rule}
              className="rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm leading-6 text-slate-700"
            >
              {rule}
            </div>
          ))}
        </div>
      </AppSectionCard>
    </AppScreenShell>
  );
}
