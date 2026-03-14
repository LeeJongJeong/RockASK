import { RoutePlaceholderPage } from "@/components/route-placeholder-page";
import { appRoutes } from "@/lib/routes";

export default function KnowledgeSpacesPage() {
  return (
    <RoutePlaceholderPage
      eyebrow="Knowledge Spaces"
      title="지식 공간"
      description="팀별 컬렉션, 공개 범위, 인덱싱 상태를 관리하는 화면입니다. P0에서는 대시보드의 주요 링크를 받는 목록 진입점만 준비합니다."
      routePath={appRoutes.knowledgeSpaces}
      primaryAction={{ href: appRoutes.documentsUpload, label: "문서 업로드로 이동" }}
      secondaryAction={{ href: appRoutes.dashboard, label: "대시보드로 돌아가기" }}
    />
  );
}
