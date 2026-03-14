import { RoutePlaceholderPage } from "@/components/route-placeholder-page";
import { appRoutes, chatDetailRoute } from "@/lib/routes";

export default async function ChatDetailPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;

  return (
    <RoutePlaceholderPage
      eyebrow="Conversation Detail"
      title={`채팅 ${chatId}`}
      description="검색 제출 후 이동하는 채팅 상세 경로입니다. P0에서는 fallback 이동 경로가 유효하도록 상세 페이지 골격만 먼저 제공합니다."
      routePath={chatDetailRoute(chatId)}
      primaryAction={{ href: appRoutes.chats, label: "채팅 목록으로 이동" }}
      secondaryAction={{ href: appRoutes.dashboard, label: "대시보드로 돌아가기" }}
    />
  );
}
