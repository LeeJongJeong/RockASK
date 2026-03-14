import { RoutePlaceholderPage } from "@/components/route-placeholder-page";
import { appRoutes } from "@/lib/routes";

export default function ChatsPage() {
  return (
    <RoutePlaceholderPage
      eyebrow="Conversation Hub"
      title="채팅 목록"
      description="저장된 질문 세션과 최근 답변 기록을 확인하는 영역입니다. P0에서는 Landing 진입 링크가 깨지지 않도록 플레이스홀더 페이지를 제공합니다."
      routePath={appRoutes.chats}
      primaryAction={{ href: appRoutes.chatNew, label: "새 질문 시작" }}
      secondaryAction={{ href: appRoutes.dashboard, label: "대시보드로 돌아가기" }}
    />
  );
}
