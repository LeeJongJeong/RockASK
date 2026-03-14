import { RoutePlaceholderPage } from "@/components/route-placeholder-page";
import { appRoutes } from "@/lib/routes";

export default function IngestionPage() {
  return (
    <RoutePlaceholderPage
      eyebrow="Pipeline Operations"
      title="수집 파이프라인"
      description="연결된 데이터 소스와 인덱싱 작업 상태를 운영하는 화면입니다. P0에서는 네비게이션과 빠른 액션이 깨지지 않도록 최소 페이지를 제공합니다."
      routePath={appRoutes.ingestion}
      primaryAction={{ href: appRoutes.documentsUpload, label: "문서 업로드로 이동" }}
      secondaryAction={{ href: appRoutes.dashboard, label: "대시보드로 돌아가기" }}
    />
  );
}
