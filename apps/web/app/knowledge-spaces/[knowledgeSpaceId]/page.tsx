import { RoutePlaceholderPage } from "@/components/route-placeholder-page";

interface KnowledgeSpaceDetailPageProps {
  params: Promise<{
    knowledgeSpaceId: string;
  }>;
}

export default async function KnowledgeSpaceDetailPage({ params }: KnowledgeSpaceDetailPageProps) {
  const { knowledgeSpaceId } = await params;

  return (
    <RoutePlaceholderPage
      title={`지식 공간 ${knowledgeSpaceId}`}
      description="Landing 카드에서 이동하는 지식 공간 상세 placeholder입니다."
    />
  );
}
