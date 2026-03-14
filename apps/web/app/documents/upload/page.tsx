import { RoutePlaceholderPage } from "@/components/route-placeholder-page";
import { appRoutes } from "@/lib/routes";

export default function DocumentUploadPage() {
  return (
    <RoutePlaceholderPage
      eyebrow="Ingestion"
      title="문서 업로드"
      description="PDF, Word, PPT, 위키 문서를 등록하고 수집 파이프라인으로 넘기는 화면입니다. P0에서는 즉시 실행 카드의 진입 경로만 우선 보장합니다."
      routePath={appRoutes.documentsUpload}
      primaryAction={{ href: appRoutes.knowledgeSpaces, label: "지식 공간 보기" }}
      secondaryAction={{ href: appRoutes.dashboard, label: "대시보드로 돌아가기" }}
    />
  );
}
