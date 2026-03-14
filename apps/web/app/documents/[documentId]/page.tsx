import { RoutePlaceholderPage } from "@/components/route-placeholder-page";

interface DocumentDetailPageProps {
  params: Promise<{
    documentId: string;
  }>;
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { documentId } = await params;

  return (
    <RoutePlaceholderPage
      title={`문서 ${documentId}`}
      description="최근 업데이트 카드에서 이동하는 문서 상세 placeholder입니다."
    />
  );
}
