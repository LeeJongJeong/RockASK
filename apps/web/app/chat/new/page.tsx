import { RoutePlaceholderPage } from "@/components/route-placeholder-page";
import { appRoutes } from "@/lib/routes";

export default function NewChatPage() {
  return (
    <RoutePlaceholderPage
      title="새 질문 시작"
      description="새 질문 작성 화면 placeholder입니다. Landing에서 넘어온 검색 흐름은 이 경로를 기준으로 이어집니다."
      primaryLabel="최근 채팅 보기"
      primaryHref={appRoutes.chats}
    />
  );
}
