import { RoutePlaceholderPage } from "@/components/route-placeholder-page";
import { appRoutes } from "@/lib/routes";

export default function NewChatPage() {
  return (
    <RoutePlaceholderPage
      eyebrow="Query Workspace"
      title="새 질문 시작"
      description="대시보드에서 넘어온 검색어와 선택 Scope를 받아 새 대화를 시작하는 화면입니다. P0에서는 라우트 골격만 제공하고, 이후 질의 생성 플로우를 연결합니다."
      routePath={appRoutes.chatNew}
      primaryAction={{ href: appRoutes.dashboard, label: "대시보드로 돌아가기" }}
      secondaryAction={{ href: appRoutes.chats, label: "최근 채팅 보기" }}
    />
  );
}
