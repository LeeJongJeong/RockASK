import { RoutePlaceholderPage } from "@/components/route-placeholder-page";
import { appRoutes, documentDetailRoute } from "@/lib/routes";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <RoutePlaceholderPage
      eyebrow="Document Detail"
      title={`문서 ${documentId}`}
      description="최근 업데이트 카드에서 이동하는 문서 상세 경로입니다. P0에서는 링크 유효성과 화면 흐름을 확인할 수 있는 골격만 먼저 제공합니다."
      routePath={documentDetailRoute(documentId)}
      primaryAction={{ href: appRoutes.dashboard, label: "대시보드로 돌아가기" }}
      secondaryAction={{ href: appRoutes.documentsUpload, label: "문서 업로드로 이동" }}
    />
  );
}
