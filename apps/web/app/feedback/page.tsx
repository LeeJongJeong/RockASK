import { RoutePlaceholderPage } from "@/components/route-placeholder-page";
import { appRoutes } from "@/lib/routes";

export default function FeedbackPage() {
  return (
    <RoutePlaceholderPage
      eyebrow="Quality Feedback"
      title="오답 신고"
      description="출처 오류, 권한 누락, 부정확 답변을 접수하는 화면입니다. P0에서는 빠른 이동 경로를 유지하기 위한 플레이스홀더만 제공합니다."
      routePath={appRoutes.feedback}
      primaryAction={{ href: appRoutes.dashboard, label: "대시보드로 돌아가기" }}
      secondaryAction={{ href: appRoutes.chats, label: "채팅 기록 보기" }}
    />
  );
}
