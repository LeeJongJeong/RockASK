import { RoutePlaceholderPage } from "@/components/route-placeholder-page";

interface ChatDetailPageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { chatId } = await params;

  return (
    <RoutePlaceholderPage
      title={`채팅 ${chatId}`}
      description="질의 생성 API가 redirect하는 채팅 상세 화면 placeholder입니다."
    />
  );
}
