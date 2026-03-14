import { RoutePlaceholderPage } from "@/components/route-placeholder-page";
import { appRoutes } from "@/lib/routes";

export default function AssistantsPage() {
  return (
    <RoutePlaceholderPage
      eyebrow="Assistant Catalog"
      title="전문 봇"
      description="업무별 프리셋과 응답 정책이 적용된 Assistant를 관리하는 화면입니다. P0에서는 사이드바 네비게이션 경로만 우선 활성화합니다."
      routePath={appRoutes.assistants}
      primaryAction={{ href: appRoutes.dashboard, label: "대시보드로 돌아가기" }}
      secondaryAction={{ href: appRoutes.chatNew, label: "새 질문 시작" }}
    />
  );
}
