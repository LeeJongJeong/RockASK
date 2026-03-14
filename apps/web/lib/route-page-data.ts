import type {
  ChatDetailResponse,
  ChatListItemDto,
  ChatListResponse,
  ChatStatus,
  DashboardResponse,
  DocumentDetailResponse,
  DocumentRelatedLinkItemDto,
  DocumentStatus,
  KnowledgeSpaceDetailResponse,
  KnowledgeSpaceListItemDto,
  KnowledgeSpaceListResponse,
  KnowledgeSpaceStatus,
} from "@rockask/types";

import { buildApiUrl, getApiBaseUrl } from "@/lib/api-url";
import { getDashboard } from "@/lib/get-dashboard";
import { type DashboardFixture, normalizeDashboardFixture } from "@/lib/mock-dashboard-fixtures";
import { appRoutes } from "@/lib/routes";

type SearchParamValue = string | string[] | undefined;

type ChatTranscriptRole = "user" | "assistant";

interface ChatTranscriptItem {
  role: ChatTranscriptRole;
  content: string;
  note?: string;
}

interface RelatedLinkItem {
  href: string;
  label: string;
  hint: string;
}

interface MetricItem {
  label: string;
  value: string;
  hint?: string;
}

interface ChatListPageItem {
  id: string;
  title: string;
  assistantName: string;
  lastMessagePreview: string | null;
  lastMessageRelative: string;
  status: ChatStatus;
}

interface KnowledgeSpaceListPageItem {
  id: string;
  name: string;
  ownerTeam: string;
  contactName: string;
  status: KnowledgeSpaceStatus;
  visibility: string;
  docCount: number;
  lastUpdatedRelative: string;
}

export interface DashboardPageSearchParams {
  fixture?: SearchParamValue;
}

export interface ChatDetailPageData {
  chat: {
    id: string;
    title: string;
    assistantName: string;
    lastMessageRelative: string;
    status: ChatStatus;
  };
  summary: string;
  answerSnapshot: string;
  transcript: ChatTranscriptItem[];
  sources: RelatedLinkItem[];
  followUps: string[];
  metrics: MetricItem[];
}

export interface KnowledgeSpaceDetailPageData {
  space: {
    id: string;
    name: string;
    ownerTeam: string;
    contactName: string;
    status: KnowledgeSpaceStatus;
    visibility: string;
    docCount: number;
    lastUpdatedRelative: string;
  };
  overview: string;
  stewardship: string;
  coverageTopics: string[];
  operatingRules: string[];
  linkedDocuments: RelatedLinkItem[];
  metrics: MetricItem[];
}

export interface DocumentDetailPageData {
  document: {
    id: string;
    title: string;
    ownerTeam: string;
    visibility: string;
    status: DocumentStatus;
    updatedRelative: string;
    summary: string;
  };
  overview: string;
  highlights: string[];
  recommendedQuestions: string[];
  relatedLinks: RelatedLinkItem[];
  metadata: Array<{ label: string; value: string }>;
}

export interface ChatsPageData {
  dashboard: DashboardResponse;
  fixture: DashboardFixture | null;
  chats: ChatListPageItem[];
}

export interface KnowledgeSpacesPageData {
  dashboard: DashboardResponse;
  fixture: DashboardFixture | null;
  spaces: KnowledgeSpaceListPageItem[];
}

export interface ChatDetailLoaderResult {
  dashboard: DashboardResponse;
  fixture: DashboardFixture | null;
  detail: ChatDetailPageData | null;
}

export interface KnowledgeSpaceDetailLoaderResult {
  dashboard: DashboardResponse;
  fixture: DashboardFixture | null;
  detail: KnowledgeSpaceDetailPageData | null;
}

export interface DocumentDetailLoaderResult {
  dashboard: DashboardResponse;
  fixture: DashboardFixture | null;
  detail: DocumentDetailPageData | null;
}

export const assistantCatalog = [
  {
    id: "assistant-policy",
    name: "정책 안내 어시스턴트",
    description: "인사, 보안, 승인 정책을 빠르게 찾아서 근거 문장까지 붙여 줍니다.",
    strengths: ["예외 규정 요약", "정책 차이 비교", "출처 링크 제공"],
    coverage: "인사 규정, 보안 체크리스트, 온보딩 자료",
  },
  {
    id: "assistant-engineering",
    name: "기술 문서 어시스턴트",
    description: "설계 문서와 운영 가이드를 기준으로 변경 이력과 주의사항을 정리합니다.",
    strengths: ["운영 절차 요약", "장애 대응 가이드", "최근 변경점 설명"],
    coverage: "SRE 가이드, 엔지니어링 플레이북, 배포 절차",
  },
  {
    id: "assistant-briefing",
    name: "브리핑 어시스턴트",
    description: "흩어진 문서를 짧은 브리핑 포맷으로 묶어 회의 전에 바로 공유할 수 있게 만듭니다.",
    strengths: ["핵심만 3줄 요약", "액션 아이템 추출", "관련 문서 묶음 정리"],
    coverage: "사업 계획, 회의록, 업무 보고서",
  },
] as const;

export const feedbackCategories = [
  {
    title: "출처가 부족한 답변",
    description: "근거 문서가 없거나 인용이 불완전하면 바로 접수합니다.",
  },
  {
    title: "권한 범위를 벗어난 노출",
    description: "내 권한 밖의 문서 제목이나 내용이 보이면 긴급으로 분류합니다.",
  },
  {
    title: "부정확하거나 오래된 정보",
    description: "문서 최신본과 답변 내용이 다를 때 버전을 함께 남깁니다.",
  },
] as const;

export const uploadSourceOptions = [
  {
    title: "파일 업로드",
    description: "PDF, DOCX, PPTX를 업로드해 바로 색인 파이프라인으로 보냅니다.",
  },
  {
    title: "공유 드라이브 연결",
    description: "팀 폴더를 연결해 주기적으로 동기화합니다.",
  },
  {
    title: "위키/문서 툴 연동",
    description: "사내 위키, 문서 관리 툴, 티켓 시스템과 연결합니다.",
  },
] as const;

export const ingestionStages = [
  {
    title: "수집",
    description: "원본 파일과 메타데이터를 가져와 권한 정책을 먼저 확인합니다.",
  },
  {
    title: "정제",
    description: "본문, 제목, 태그, 접근 권한을 문서 단위로 정규화합니다.",
  },
  {
    title: "색인",
    description: "검색용 인덱스와 임베딩을 만들고 문서 버전을 갱신합니다.",
  },
  {
    title: "검증",
    description: "샘플 질의로 인용, 접근 권한, 최신성 상태를 점검합니다.",
  },
] as const;

const chatFallbackMetaById: Record<
  string,
  { createdAt: string; lastMessageAt: string; status: ChatStatus }
> = {
  "chat-1": {
    createdAt: "2026-03-14T10:24:00+09:00",
    lastMessageAt: "2026-03-14T10:30:00+09:00",
    status: "ready",
  },
  "chat-2": {
    createdAt: "2026-03-13T16:02:00+09:00",
    lastMessageAt: "2026-03-13T16:20:00+09:00",
    status: "ready",
  },
  "chat-3": {
    createdAt: "2026-03-11T14:10:00+09:00",
    lastMessageAt: "2026-03-11T14:35:00+09:00",
    status: "ready",
  },
};

const knowledgeSpaceFallbackUpdatedAtById: Record<string, string> = {
  "ks-strategy": "2026-03-14T13:05:00+09:00",
  "ks-engineering": "2026-03-14T14:55:00+09:00",
};

const documentFallbackMetaById: Record<string, { updatedAt: string; status: DocumentStatus }> = {
  "update-security": {
    updatedAt: "2026-03-14T14:12:00+09:00",
    status: "approved",
  },
  "update-onboarding": {
    updatedAt: "2026-03-14T13:48:00+09:00",
    status: "indexing",
  },
  "update-sre": {
    updatedAt: "2026-03-14T13:00:00+09:00",
    status: "approved",
  },
};

const chatDetailFallbackBodies: Record<string, Omit<ChatDetailResponse, "chat">> = {
  "chat-1": {
    summary:
      "신입 입사자의 첫 주 일정, 필수 교육, 계정 발급 순서를 한 번에 묶어 달라는 요청입니다.",
    answer_snapshot:
      "온보딩 답변은 첫날 준비, 첫 주 체크리스트, 누락 시 확인할 담당 팀 순서로 정리하는 것이 가장 재사용성이 높습니다.",
    messages: [
      {
        id: "msg-101",
        role: "user",
        content: "신입 입사자 온보딩 문서와 필수 교육 일정을 한 번에 정리해 줘.",
        created_at: "2026-03-14T10:24:00+09:00",
        note: null,
      },
      {
        id: "msg-102",
        role: "assistant",
        content:
          "첫날에는 계정 발급, 보안 서약, 필수 협업 툴 접속 확인을 우선 진행하고 첫 주 안에 온보딩 교육 일정을 마치는 흐름으로 정리할 수 있습니다.",
        created_at: "2026-03-14T10:25:00+09:00",
        note: "온보딩 체크리스트와 인사 교육 일정 문서를 근거로 요약",
      },
      {
        id: "msg-103",
        role: "user",
        content: "누가 승인하거나 도와줘야 하는 단계도 같이 표시해 줘.",
        created_at: "2026-03-14T10:28:00+09:00",
        note: null,
      },
      {
        id: "msg-104",
        role: "assistant",
        content:
          "계정 발급은 IT 운영, 교육 일정 확정은 인사팀, 장비 준비는 운영 지원 담당으로 표기해 두면 실제 실행에 바로 쓸 수 있습니다.",
        created_at: "2026-03-14T10:30:00+09:00",
        note: null,
      },
    ],
    sources: [
      {
        id: "source-1",
        source_type: "document",
        target_id: "update-onboarding",
        label: "신입 입사자 온보딩 안내",
        hint: "첫 주 일정과 필수 서류 목록",
      },
      {
        id: "source-2",
        source_type: "knowledge_space",
        target_id: "ks-strategy",
        label: "사업 계획/공용 안내 공간",
        hint: "팀 합류 전 공유되는 공통 가이드와 업무 맥락",
      },
    ],
    follow_ups: [
      {
        id: "followup-1",
        text: "첫날 해야 하는 일만 체크리스트 형식으로 다시 정리해 줘",
      },
      {
        id: "followup-2",
        text: "개발 직군 기준으로 필요한 시스템 권한만 따로 뽑아 줘",
      },
      {
        id: "followup-3",
        text: "교육 일정과 담당 팀을 표로 만들어 줘",
      },
    ],
  },
  "chat-2": {
    summary: "최근 운영 변경 사항을 백업 절차 관점으로 요약해 달라는 요청입니다.",
    answer_snapshot:
      "핵심은 백업 주기, 점검 책임자, 장애 발생 시 롤백 절차를 1페이지로 압축하는 것입니다.",
    messages: [
      {
        id: "msg-201",
        role: "user",
        content: "아일랜드 서버 백업 정책 전달만 요약해 줘.",
        created_at: "2026-03-13T16:02:00+09:00",
        note: null,
      },
      {
        id: "msg-202",
        role: "assistant",
        content:
          "정기 백업 주기와 월간 복구 테스트, 장애 후 보고 템플릿 변경점을 중심으로 볼 수 있습니다.",
        created_at: "2026-03-13T16:08:00+09:00",
        note: "운영 가이드와 장애 보고서 작성 가이드를 함께 인용",
      },
      {
        id: "msg-203",
        role: "user",
        content: "운영팀이 바로 체크할 항목만 추려 줘.",
        created_at: "2026-03-13T16:13:00+09:00",
        note: null,
      },
      {
        id: "msg-204",
        role: "assistant",
        content:
          "백업 성공 여부, 저장 위치, 복구 테스트 결과, 알림 대상 네 가지 항목을 우선 확인하도록 요약했습니다.",
        created_at: "2026-03-13T16:20:00+09:00",
        note: null,
      },
    ],
    sources: [
      {
        id: "source-3",
        source_type: "document",
        target_id: "update-sre",
        label: "장애 보고서 작성 가이드",
        hint: "운영 절차와 사후 분석 구조 정리",
      },
      {
        id: "source-4",
        source_type: "knowledge_space",
        target_id: "ks-engineering",
        label: "기술 개발 본부 가이드라인",
        hint: "운영 표준과 엔지니어링 문서 모음",
      },
    ],
    follow_ups: [
      { id: "followup-4", text: "백업 실패 시 에스컬레이션 대상만 다시 보여 줘" },
      { id: "followup-5", text: "운영팀 공지 문안으로 바꿔 줘" },
      { id: "followup-6", text: "월간 점검 체크리스트로 변환해 줘" },
    ],
  },
  "chat-3": {
    summary: "예산 문서에서 핵심 사실만 추려 보고용으로 정리해 달라는 요청입니다.",
    answer_snapshot:
      "수치 요약보다 승인 근거와 의사결정 포인트를 함께 보여 주는 편이 재사용성이 높습니다.",
    messages: [
      {
        id: "msg-301",
        role: "user",
        content: "Q3 예산 문서에서 핵심 이슈만 짚어 줘.",
        created_at: "2026-03-11T14:10:00+09:00",
        note: null,
      },
      {
        id: "msg-302",
        role: "assistant",
        content:
          "예산 변동이 큰 항목, 승인 대기 안건, 다음 의사결정 시점 기준으로 나눠 요약할 수 있습니다.",
        created_at: "2026-03-11T14:18:00+09:00",
        note: "사업 계획 관련 문서를 근거로 요약",
      },
      {
        id: "msg-303",
        role: "user",
        content: "회의에서 바로 읽을 수 있게 짧게 바꿔 줘.",
        created_at: "2026-03-11T14:25:00+09:00",
        note: null,
      },
      {
        id: "msg-304",
        role: "assistant",
        content:
          "변동 폭이 큰 항목 2개와 이번 주 안에 결정해야 할 안건 1개만 남기는 형식으로 다시 정리했습니다.",
        created_at: "2026-03-11T14:35:00+09:00",
        note: null,
      },
    ],
    sources: [
      {
        id: "source-5",
        source_type: "knowledge_space",
        target_id: "ks-strategy",
        label: "2026 상반기 사업 계획",
        hint: "예산/우선순위 문서가 모여 있는 공간",
      },
      {
        id: "source-6",
        source_type: "document",
        target_id: "update-security",
        label: "보안 점검 체크리스트 v3",
        hint: "예산 승인 전 필수 체크 항목 예시",
      },
    ],
    follow_ups: [
      { id: "followup-7", text: "리더 보고용 3줄 브리핑으로 줄여 줘" },
      { id: "followup-8", text: "승인 대기 안건만 따로 뽑아 줘" },
      { id: "followup-9", text: "리스크 항목 기준으로 다시 분류해 줘" },
    ],
  },
};

const knowledgeSpaceDetailFallbackBodies: Record<
  string,
  Omit<KnowledgeSpaceDetailResponse, "space">
> = {
  "ks-strategy": {
    overview:
      "전사 전략, 예산, 우선순위 문서를 모아두는 공간입니다. 리더 브리핑이나 회의 전 사전 질의에 자주 사용됩니다.",
    stewardship: "전략기획팀이 문서 구조와 공개 범위를 관리하고, 월 1회 최신성 점검을 진행합니다.",
    coverage_topics: [
      { id: "topic-1", text: "사업 목표와 분기 우선순위" },
      { id: "topic-2", text: "예산 승인 흐름" },
      { id: "topic-3", text: "경영 회의용 브리핑 자료" },
    ],
    operating_rules: [
      { id: "rule-1", text: "리더십 리뷰가 끝난 문서만 전사 공용으로 공개합니다." },
      { id: "rule-2", text: "예산 수치가 바뀌면 24시간 안에 변경 이력을 추가합니다." },
      { id: "rule-3", text: "회의용 요약본과 원문 링크를 항상 함께 유지합니다." },
    ],
    linked_documents: [
      {
        id: "link-1",
        target_type: "document",
        target_id: "update-security",
        label: "보안 점검 체크리스트 v3",
        hint: "전사 공통 준수 항목 문서",
      },
      {
        id: "link-2",
        target_type: "document",
        target_id: "update-onboarding",
        label: "신입 입사자 온보딩 안내",
        hint: "공통 운영 문서 예시",
      },
    ],
  },
  "ks-engineering": {
    overview:
      "기술 개발 본부의 운영 가이드, 장애 대응 문서, 배포 체크리스트를 묶어 두는 공간입니다.",
    stewardship: "플랫폼개발팀과 SRE가 함께 유지하며 장애 대응 문서는 배포 후 바로 갱신합니다.",
    coverage_topics: [
      { id: "topic-4", text: "장애 대응 절차" },
      { id: "topic-5", text: "배포/백업 체크리스트" },
      { id: "topic-6", text: "운영 문서 최신 변경점" },
    ],
    operating_rules: [
      { id: "rule-4", text: "운영 가이드 변경 시 관련 보고 템플릿까지 함께 수정합니다." },
      { id: "rule-5", text: "배포 후 1영업일 내에 색인 상태를 다시 확인합니다." },
      { id: "rule-6", text: "권한 범위는 기술 본부 공개를 기본값으로 둡니다." },
    ],
    linked_documents: [
      {
        id: "link-3",
        target_type: "document",
        target_id: "update-sre",
        label: "장애 보고서 작성 가이드",
        hint: "사후 분석과 영향 범위 기록 템플릿",
      },
      {
        id: "link-4",
        target_type: "document",
        target_id: "update-security",
        label: "보안 점검 체크리스트 v3",
        hint: "배포 전후 공통 점검 항목",
      },
    ],
  },
};

const documentDetailFallbackBodies: Record<string, Omit<DocumentDetailResponse, "document">> = {
  "update-security": {
    overview:
      "보안 점검 체크리스트 v3는 배포 전후 필수 확인 항목과 테스트 예외 규칙을 함께 정리한 문서입니다.",
    highlights: [
      { id: "highlight-1", text: "민감 권한 점검 항목이 추가되었습니다." },
      { id: "highlight-2", text: "테스트 환경 예외 규칙이 별도 섹션으로 분리되었습니다." },
      {
        id: "highlight-3",
        text: "검수 완료 후 운영 반영 시 확인해야 할 승인 흐름이 명확해졌습니다.",
      },
    ],
    recommended_questions: [
      { id: "rq-1", text: "이번 버전에서 꼭 달라진 항목만 요약해 줘" },
      { id: "rq-2", text: "배포 전에 확인해야 하는 체크포인트만 뽑아 줘" },
      { id: "rq-3", text: "예외 허용 조건을 정책 문장 기준으로 설명해 줘" },
    ],
    related_links: [
      {
        id: "rel-1",
        target_type: "knowledge_space",
        target_id: "ks-strategy",
        label: "2026 상반기 사업 계획",
        hint: "전사 공통 정책이 모여 있는 공간",
      },
      {
        id: "rel-2",
        target_type: "knowledge_space",
        target_id: "ks-engineering",
        label: "기술 개발 본부 가이드라인",
        hint: "운영/배포와 함께 보는 문서 공간",
      },
    ],
  },
  "update-onboarding": {
    overview:
      "신입 입사자 온보딩 안내는 첫 주 일정, 필수 서류, 교육 순서, 부서별 준비 항목을 한 페이지에 정리한 문서입니다.",
    highlights: [
      {
        id: "highlight-4",
        text: "입문 교육 일정과 필수 서명 문서 안내가 최신 버전으로 갱신되었습니다.",
      },
      { id: "highlight-5", text: "직군별 장비/계정 준비 항목이 추가되었습니다." },
      { id: "highlight-6", text: "첫 주 담당 팀과 연락 창구가 표 형식으로 정리되었습니다." },
    ],
    recommended_questions: [
      { id: "rq-4", text: "첫날에 바로 해야 하는 일만 다시 정리해 줘" },
      { id: "rq-5", text: "개발 직군 기준 준비물만 따로 보여 줘" },
      { id: "rq-6", text: "담당 팀과 연락 창구를 표로 만들어 줘" },
    ],
    related_links: [
      {
        id: "rel-3",
        target_type: "chat",
        target_id: "chat-1",
        label: "온보딩 질문 대화 보기",
        hint: "실제 검색 결과가 어떤 답변으로 이어졌는지 확인",
      },
      {
        id: "rel-4",
        target_type: "knowledge_space",
        target_id: "ks-strategy",
        label: "전사 공용 안내 공간",
        hint: "공통 운영 문서가 모여 있는 공간",
      },
    ],
  },
  "update-sre": {
    overview:
      "장애 보고서 작성 가이드는 사후 분석 템플릿과 영향 범위 기록 방식을 표준화한 운영 문서입니다.",
    highlights: [
      { id: "highlight-7", text: "사후 분석 요약본에 서비스 영향 범위 필드가 추가되었습니다." },
      { id: "highlight-8", text: "재발 방지 항목을 액션 아이템 중심으로 재구성했습니다." },
      {
        id: "highlight-9",
        text: "운영팀 공지에 바로 붙일 수 있는 보고 문안 예시가 포함되었습니다.",
      },
    ],
    recommended_questions: [
      { id: "rq-7", text: "운영팀 공지용으로 5줄만 뽑아 줘" },
      { id: "rq-8", text: "백업 실패 사고에 맞는 작성 예시를 보여 줘" },
      { id: "rq-9", text: "이번 변경으로 필수 입력값이 뭐가 바뀌었는지 설명해 줘" },
    ],
    related_links: [
      {
        id: "rel-5",
        target_type: "chat",
        target_id: "chat-2",
        label: "운영 변경 요약 대화 보기",
        hint: "실제 질의와 응답 흐름 확인",
      },
      {
        id: "rel-6",
        target_type: "knowledge_space",
        target_id: "ks-engineering",
        label: "기술 개발 본부 가이드라인",
        hint: "운영 절차를 함께 관리하는 지식 공간",
      },
    ],
  },
};

export async function loadDashboardPageData(
  searchParams?: Promise<DashboardPageSearchParams>,
): Promise<{ dashboard: DashboardResponse; fixture: DashboardFixture | null }> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const fixture = normalizeDashboardFixture(resolvedSearchParams?.fixture);
  const dashboard = await getDashboard(fixture);

  return { dashboard, fixture };
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatLatency(milliseconds: number) {
  if (milliseconds <= 0) {
    return "대기 중";
  }

  return `${(milliseconds / 1000).toFixed(1)}초`;
}

export function formatRate(value: number) {
  return `${Math.round(value * 100)}%`;
}

async function fetchRouteApi<T>(path: string, fallbackValue: T, fixture?: DashboardFixture | null) {
  if (fixture || !getApiBaseUrl()) {
    return fallbackValue;
  }

  try {
    const response = await fetch(buildApiUrl(path), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return fallbackValue;
    }

    return (await response.json()) as T;
  } catch {
    return fallbackValue;
  }
}

function mapChatSourceHref(sourceType: string, targetId: string) {
  if (sourceType === "document") {
    return appRoutes.documentDetail(targetId);
  }

  return appRoutes.knowledgeSpaceDetail(targetId);
}

function mapDocumentRelatedHref(link: DocumentRelatedLinkItemDto) {
  switch (link.target_type) {
    case "chat":
      return appRoutes.chatDetail(link.target_id);
    case "document":
      return appRoutes.documentDetail(link.target_id);
    case "knowledge_space":
      return appRoutes.knowledgeSpaceDetail(link.target_id);
  }
}

function buildFallbackChatListResponse(dashboard: DashboardResponse): ChatListResponse {
  return {
    items: dashboard.recentChats.map((chat) => {
      const meta = chatFallbackMetaById[chat.id];
      const detailBody = chatDetailFallbackBodies[chat.id];
      const lastAssistantMessage = [...(detailBody?.messages ?? [])]
        .reverse()
        .find((message) => message.role === "assistant");

      return {
        id: chat.id,
        title: chat.title,
        assistant_name: chat.assistantName,
        last_message_preview: detailBody?.answer_snapshot ?? lastAssistantMessage?.content ?? null,
        last_message_at: meta?.lastMessageAt ?? dashboard.health.lastSyncAt,
        last_message_relative: chat.lastMessageRelative,
        status: meta?.status ?? "ready",
      };
    }),
    next_cursor: null,
  };
}

function buildFallbackChatDetailResponse(
  dashboard: DashboardResponse,
  chatId: string,
): ChatDetailResponse | null {
  const chat = dashboard.recentChats.find((item) => item.id === chatId);
  if (!chat) {
    return null;
  }

  const meta = chatFallbackMetaById[chatId] ?? {
    createdAt: dashboard.health.lastSyncAt,
    lastMessageAt: dashboard.health.lastSyncAt,
    status: "ready" as const,
  };

  const fallbackBody =
    chatDetailFallbackBodies[chatId] ??
    ({
      summary: "선택한 대화를 다시 이어서 보기 위한 상세 화면입니다.",
      answer_snapshot:
        "현재 저장된 요약이 없어도 최근 질문 제목과 연결된 채팅 흐름을 이어갈 수 있습니다.",
      messages: [
        {
          id: `${chat.id}-user`,
          role: "user",
          content: chat.title,
          created_at: meta.createdAt,
          note: null,
        },
        {
          id: `${chat.id}-assistant`,
          role: "assistant",
          content: "이 대화는 저장된 최근 기록을 기반으로 재진입할 수 있도록 준비된 화면입니다.",
          created_at: meta.lastMessageAt,
          note: null,
        },
      ],
      sources: [],
      follow_ups: [
        { id: `${chat.id}-followup-1`, text: "이 질문을 더 구체적으로 다시 작성해 줘" },
        { id: `${chat.id}-followup-2`, text: "관련 문서를 먼저 보여 줘" },
      ],
    } satisfies Omit<ChatDetailResponse, "chat">);

  return {
    chat: {
      id: chat.id,
      title: chat.title,
      assistant_name: chat.assistantName,
      status: meta.status,
      created_at: meta.createdAt,
      last_message_at: meta.lastMessageAt,
      last_message_relative: chat.lastMessageRelative,
    },
    ...fallbackBody,
  };
}

function buildFallbackKnowledgeSpaceListResponse(
  dashboard: DashboardResponse,
): KnowledgeSpaceListResponse {
  return {
    items: dashboard.knowledgeSpaces.map((space) => ({
      id: space.id,
      name: space.name,
      owner_team: space.ownerTeam,
      contact_name: space.contactName,
      status: space.status,
      visibility: space.visibility,
      doc_count: space.docCount,
      last_updated_at: knowledgeSpaceFallbackUpdatedAtById[space.id] ?? dashboard.health.lastSyncAt,
      last_updated_relative: space.lastUpdatedRelative,
    })),
    next_cursor: null,
  };
}

function buildFallbackKnowledgeSpaceDetailResponse(
  dashboard: DashboardResponse,
  knowledgeSpaceId: string,
): KnowledgeSpaceDetailResponse | null {
  const space = dashboard.knowledgeSpaces.find((item) => item.id === knowledgeSpaceId);
  if (!space) {
    return null;
  }

  const fallbackBody =
    knowledgeSpaceDetailFallbackBodies[knowledgeSpaceId] ??
    ({
      overview: `${space.ownerTeam}에서 운영하는 지식 공간입니다. 권한 범위에 맞는 문서만 노출됩니다.`,
      stewardship: `${space.contactName}에게 운영 문의를 남길 수 있습니다.`,
      coverage_topics: [
        { id: `${space.id}-topic-1`, text: "팀 문서 요약" },
        { id: `${space.id}-topic-2`, text: "자주 찾는 정책" },
        { id: `${space.id}-topic-3`, text: "최근 갱신 문서" },
      ],
      operating_rules: [
        { id: `${space.id}-rule-1`, text: "최신 승인 버전만 검색에 노출합니다." },
        { id: `${space.id}-rule-2`, text: "권한 범위 밖 문서는 검색 결과에서 제외합니다." },
        { id: `${space.id}-rule-3`, text: "색인 상태는 운영 대시보드와 함께 관리합니다." },
      ],
      linked_documents: [],
    } satisfies Omit<KnowledgeSpaceDetailResponse, "space">);

  return {
    space: {
      id: space.id,
      name: space.name,
      owner_team: space.ownerTeam,
      contact_name: space.contactName,
      status: space.status,
      visibility: space.visibility,
      doc_count: space.docCount,
      last_updated_at: knowledgeSpaceFallbackUpdatedAtById[space.id] ?? dashboard.health.lastSyncAt,
      last_updated_relative: space.lastUpdatedRelative,
    },
    ...fallbackBody,
  };
}

function buildFallbackDocumentDetailResponse(
  dashboard: DashboardResponse,
  documentId: string,
): DocumentDetailResponse | null {
  const document = dashboard.recentUpdates.find((item) => item.id === documentId);
  if (!document) {
    return null;
  }

  const meta = documentFallbackMetaById[document.id] ?? {
    updatedAt: dashboard.health.lastSyncAt,
    status: "approved" as const,
  };

  const fallbackBody =
    documentDetailFallbackBodies[documentId] ??
    ({
      overview: document.summary,
      highlights: [
        { id: `${document.id}-highlight-1`, text: `${document.team}에서 최근 갱신한 문서입니다.` },
        {
          id: `${document.id}-highlight-2`,
          text: `공개 범위는 ${document.visibility} 기준으로 관리됩니다.`,
        },
        {
          id: `${document.id}-highlight-3`,
          text: "질문 화면에서 이 문서를 직접 출처로 참조할 수 있습니다.",
        },
      ],
      recommended_questions: [
        { id: `${document.id}-question-1`, text: "핵심 변경점만 짧게 요약해 줘" },
        { id: `${document.id}-question-2`, text: "이 문서가 필요한 상황을 예시로 설명해 줘" },
        { id: `${document.id}-question-3`, text: "관련 문서를 함께 보여 줘" },
      ],
      related_links: [],
    } satisfies Omit<DocumentDetailResponse, "document">);

  return {
    document: {
      id: document.id,
      title: document.title,
      owner_team: document.team,
      visibility: document.visibility,
      status: meta.status,
      updated_at: meta.updatedAt,
      updated_relative: document.updatedRelative,
      summary: document.summary,
    },
    ...fallbackBody,
  };
}

function mapChatListItemToPageData(item: ChatListItemDto): ChatListPageItem {
  return {
    id: item.id,
    title: item.title,
    assistantName: item.assistant_name,
    lastMessagePreview: item.last_message_preview,
    lastMessageRelative: item.last_message_relative,
    status: item.status,
  };
}

function mapChatDetailResponseToPageData(response: ChatDetailResponse): ChatDetailPageData {
  return {
    chat: {
      id: response.chat.id,
      title: response.chat.title,
      assistantName: response.chat.assistant_name,
      lastMessageRelative: response.chat.last_message_relative,
      status: response.chat.status,
    },
    summary: response.summary,
    answerSnapshot: response.answer_snapshot,
    transcript: response.messages.map((message) => ({
      role: message.role,
      content: message.content,
      note: message.note ?? undefined,
    })),
    sources: response.sources.map((source) => ({
      href: mapChatSourceHref(source.source_type, source.target_id),
      label: source.label,
      hint: source.hint,
    })),
    followUps: response.follow_ups.map((item) => item.text),
    metrics: [
      {
        label: "최근 응답 시각",
        value: response.chat.last_message_relative,
        hint: "최근 assistant 응답 기준",
      },
      {
        label: "참조 문서",
        value: `${formatCount(response.sources.length)}건`,
        hint: "이 대화에서 함께 본 출처 수",
      },
      {
        label: "후속 질문",
        value: `${formatCount(response.follow_ups.length)}개`,
        hint: "같은 문맥으로 이어서 물어볼 수 있는 질문",
      },
    ],
  };
}

function mapKnowledgeSpaceListItemToPageData(
  item: KnowledgeSpaceListItemDto,
): KnowledgeSpaceListPageItem {
  return {
    id: item.id,
    name: item.name,
    ownerTeam: item.owner_team,
    contactName: item.contact_name,
    status: item.status,
    visibility: item.visibility,
    docCount: item.doc_count,
    lastUpdatedRelative: item.last_updated_relative,
  };
}

function mapKnowledgeSpaceDetailResponseToPageData(
  response: KnowledgeSpaceDetailResponse,
): KnowledgeSpaceDetailPageData {
  return {
    space: {
      id: response.space.id,
      name: response.space.name,
      ownerTeam: response.space.owner_team,
      contactName: response.space.contact_name,
      status: response.space.status,
      visibility: response.space.visibility,
      docCount: response.space.doc_count,
      lastUpdatedRelative: response.space.last_updated_relative,
    },
    overview: response.overview,
    stewardship: response.stewardship,
    coverageTopics: response.coverage_topics.map((topic) => topic.text),
    operatingRules: response.operating_rules.map((rule) => rule.text),
    linkedDocuments: response.linked_documents.map((document) => ({
      href: appRoutes.documentDetail(document.target_id),
      label: document.label,
      hint: document.hint,
    })),
    metrics: [
      {
        label: "문서 수",
        value: `${formatCount(response.space.doc_count)}건`,
        hint: "현재 공간에 연결된 문서 수",
      },
      {
        label: "운영 팀",
        value: response.space.owner_team,
        hint: "공간 구조와 공개 범위를 관리하는 팀",
      },
      {
        label: "최근 갱신",
        value: response.space.last_updated_relative,
        hint: "가장 최근 반영된 기준",
      },
    ],
  };
}

function mapDocumentDetailResponseToPageData(
  response: DocumentDetailResponse,
): DocumentDetailPageData {
  return {
    document: {
      id: response.document.id,
      title: response.document.title,
      ownerTeam: response.document.owner_team,
      visibility: response.document.visibility,
      status: response.document.status,
      updatedRelative: response.document.updated_relative,
      summary: response.document.summary,
    },
    overview: response.overview,
    highlights: response.highlights.map((highlight) => highlight.text),
    recommendedQuestions: response.recommended_questions.map((question) => question.text),
    relatedLinks: response.related_links.map((link) => ({
      href: mapDocumentRelatedHref(link),
      label: link.label,
      hint: link.hint,
    })),
    metadata: [
      { label: "소유 팀", value: response.document.owner_team },
      { label: "공개 범위", value: response.document.visibility },
      { label: "최근 갱신", value: response.document.updated_relative },
      { label: "문서 상태", value: response.document.status },
    ],
  };
}

export async function loadChatsPageData(
  searchParams?: Promise<DashboardPageSearchParams>,
): Promise<ChatsPageData> {
  const { dashboard, fixture } = await loadDashboardPageData(searchParams);
  const response = await fetchRouteApi<ChatListResponse>(
    "/api/v1/chats",
    buildFallbackChatListResponse(dashboard),
    fixture,
  );

  return {
    dashboard,
    fixture,
    chats: response.items.map(mapChatListItemToPageData),
  };
}

export async function loadKnowledgeSpacesPageData(
  searchParams?: Promise<DashboardPageSearchParams>,
): Promise<KnowledgeSpacesPageData> {
  const { dashboard, fixture } = await loadDashboardPageData(searchParams);
  const response = await fetchRouteApi<KnowledgeSpaceListResponse>(
    "/api/v1/knowledge-spaces",
    buildFallbackKnowledgeSpaceListResponse(dashboard),
    fixture,
  );

  return {
    dashboard,
    fixture,
    spaces: response.items.map(mapKnowledgeSpaceListItemToPageData),
  };
}

export async function loadChatDetailPageData(
  chatId: string,
  searchParams?: Promise<DashboardPageSearchParams>,
): Promise<ChatDetailLoaderResult> {
  const { dashboard, fixture } = await loadDashboardPageData(searchParams);
  const response = await fetchRouteApi<ChatDetailResponse | null>(
    `/api/v1/chats/${encodeURIComponent(chatId)}`,
    buildFallbackChatDetailResponse(dashboard, chatId),
    fixture,
  );

  return {
    dashboard,
    fixture,
    detail: response ? mapChatDetailResponseToPageData(response) : null,
  };
}

export async function loadKnowledgeSpaceDetailPageData(
  knowledgeSpaceId: string,
  searchParams?: Promise<DashboardPageSearchParams>,
): Promise<KnowledgeSpaceDetailLoaderResult> {
  const { dashboard, fixture } = await loadDashboardPageData(searchParams);
  const response = await fetchRouteApi<KnowledgeSpaceDetailResponse | null>(
    `/api/v1/knowledge-spaces/${encodeURIComponent(knowledgeSpaceId)}`,
    buildFallbackKnowledgeSpaceDetailResponse(dashboard, knowledgeSpaceId),
    fixture,
  );

  return {
    dashboard,
    fixture,
    detail: response ? mapKnowledgeSpaceDetailResponseToPageData(response) : null,
  };
}

export async function loadDocumentDetailPageData(
  documentId: string,
  searchParams?: Promise<DashboardPageSearchParams>,
): Promise<DocumentDetailLoaderResult> {
  const { dashboard, fixture } = await loadDashboardPageData(searchParams);
  const response = await fetchRouteApi<DocumentDetailResponse | null>(
    `/api/v1/documents/${encodeURIComponent(documentId)}`,
    buildFallbackDocumentDetailResponse(dashboard, documentId),
    fixture,
  );

  return {
    dashboard,
    fixture,
    detail: response ? mapDocumentDetailResponseToPageData(response) : null,
  };
}
