import { RoutePlaceholderPage } from "@/components/route-placeholder-page";
import { appRoutes, knowledgeSpaceDetailRoute } from "@/lib/routes";

export default async function KnowledgeSpaceDetailPage({
  params,
}: {
  params: Promise<{ knowledgeSpaceId: string }>;
}) {
  const { knowledgeSpaceId } = await params;

  return (
    <RoutePlaceholderPage
      eyebrow="Knowledge Space Detail"
      title={`지식 공간 ${knowledgeSpaceId}`}
      description="대시보드에서 선택한 지식 공간의 문서, 상태, 공개 범위를 확인하는 상세 화면입니다. P0에서는 클릭 동선을 검증하기 위한 플레이스홀더만 제공합니다."
      routePath={knowledgeSpaceDetailRoute(knowledgeSpaceId)}
      primaryAction={{ href: appRoutes.knowledgeSpaces, label: "지식 공간 목록으로 이동" }}
      secondaryAction={{ href: appRoutes.dashboard, label: "대시보드로 돌아가기" }}
    />
  );
}
