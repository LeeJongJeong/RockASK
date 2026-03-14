import type {
  DashboardResponse,
  KnowledgeSpaceSummary,
  RecentChat,
  RecentUpdate,
} from "@rockask/types";

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

export interface DashboardPageSearchParams {
  fixture?: SearchParamValue;
}

export interface ChatDetailPageData {
  chat: RecentChat;
  summary: string;
  answerSnapshot: string;
  transcript: ChatTranscriptItem[];
  sources: RelatedLinkItem[];
  followUps: string[];
  metrics: Array<{ label: string; value: string; hint?: string }>;
}

export interface KnowledgeSpaceDetailPageData {
  space: KnowledgeSpaceSummary;
  overview: string;
  stewardship: string;
  coverageTopics: string[];
  operatingRules: string[];
  linkedDocuments: RelatedLinkItem[];
  metrics: Array<{ label: string; value: string; hint?: string }>;
}

export interface DocumentDetailPageData {
  document: RecentUpdate;
  overview: string;
  highlights: string[];
  recommendedQuestions: string[];
  relatedLinks: RelatedLinkItem[];
  metadata: Array<{ label: string; value: string }>;
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

const chatDetailContent: Record<string, Omit<ChatDetailPageData, "chat">> = {
  "chat-1": {
    summary:
      "신입 입사자의 첫 주 일정, 필수 교육, 계정 발급 순서를 한 번에 묶어 달라는 요청입니다.",
    answerSnapshot:
      "온보딩 답변은 첫날 준비, 첫 주 체크리스트, 누락 시 확인할 담당 팀 순서로 정리하는 것이 가장 재사용성이 높습니다.",
    transcript: [
      {
        role: "user",
        content: "신입 입사자 온보딩 문서와 필수 교육 일정을 한 번에 정리해 줘.",
      },
      {
        role: "assistant",
        content:
          "첫날에는 계정 발급, 보안 서약, 필수 협업 툴 접속 확인을 우선 진행하고 첫 주 안에 온보딩 교육 일정을 마치는 흐름으로 정리할 수 있습니다.",
        note: "온보딩 체크리스트와 인사 교육 일정 문서를 근거로 요약",
      },
      {
        role: "user",
        content: "누가 승인하거나 도와줘야 하는 단계도 같이 표시해 줘.",
      },
      {
        role: "assistant",
        content:
          "계정 발급은 IT 운영, 교육 일정 확정은 인사팀, 장비 준비는 운영 지원 담당으로 표기해 두면 실제 실행에 바로 쓸 수 있습니다.",
      },
    ],
    sources: [
      {
        href: appRoutes.documentDetail("update-onboarding"),
        label: "신입 입사자 온보딩 안내",
        hint: "첫 주 일정과 필수 서류 목록",
      },
      {
        href: appRoutes.knowledgeSpaceDetail("ks-strategy"),
        label: "사업 계획/공용 안내 공간",
        hint: "팀 합류 전 공유되는 공통 가이드와 업무 맥락",
      },
    ],
    followUps: [
      "첫날 해야 하는 일만 체크리스트 형식으로 다시 정리해 줘",
      "개발 직군 기준으로 필요한 시스템 권한만 따로 뽑아 줘",
      "교육 일정과 담당 팀을 표로 만들어 줘",
    ],
    metrics: [
      { label: "최근 응답 시각", value: "오늘 10:30", hint: "Landing 최근 채팅과 동기화" },
      { label: "참조 문서", value: "2건", hint: "온보딩 안내 + 공통 업무 가이드" },
      { label: "후속 질문", value: "3개", hint: "같은 주제 재질문 패턴" },
    ],
  },
  "chat-2": {
    summary: "최근 운영 변경 사항을 백업 절차 관점으로 요약해 달라는 요청입니다.",
    answerSnapshot:
      "핵심은 백업 주기, 점검 책임자, 장애 발생 시 롤백 절차를 1페이지로 압축하는 것입니다.",
    transcript: [
      {
        role: "user",
        content: "아일랜드 서버 백업 정책 전달만 요약해 줘.",
      },
      {
        role: "assistant",
        content:
          "정기 백업 주기와 월간 복구 테스트, 장애 후 보고 템플릿 변경점을 중심으로 볼 수 있습니다.",
        note: "운영 가이드와 장애 보고서 작성 가이드를 함께 인용",
      },
      {
        role: "user",
        content: "운영팀이 바로 체크할 항목만 추려 줘.",
      },
      {
        role: "assistant",
        content:
          "백업 성공 여부, 저장 위치, 복구 테스트 결과, 알림 대상 네 가지 항목을 우선 확인하도록 요약했습니다.",
      },
    ],
    sources: [
      {
        href: appRoutes.documentDetail("update-sre"),
        label: "장애 보고서 작성 가이드",
        hint: "운영 절차와 사후 분석 구조 정리",
      },
      {
        href: appRoutes.knowledgeSpaceDetail("ks-engineering"),
        label: "기술 개발 본부 가이드라인",
        hint: "운영 표준과 엔지니어링 문서 모음",
      },
    ],
    followUps: [
      "백업 실패 시 에스컬레이션 대상만 다시 보여 줘",
      "운영팀 공지 문안으로 바꿔 줘",
      "월간 점검 체크리스트로 변환해 줘",
    ],
    metrics: [
      { label: "최근 응답 시각", value: "어제", hint: "운영 가이드 질문 흐름" },
      { label: "참조 문서", value: "2건", hint: "SRE 가이드 + 기술 공간" },
      { label: "후속 질문", value: "3개", hint: "운영팀 전달용 재가공" },
    ],
  },
  "chat-3": {
    summary: "예산 문서에서 핵심 사실만 추려 보고용으로 정리해 달라는 요청입니다.",
    answerSnapshot:
      "수치 요약보다 승인 근거와 의사결정 포인트를 함께 보여 주는 편이 재사용성이 높습니다.",
    transcript: [
      {
        role: "user",
        content: "Q3 예산 문서에서 핵심 이슈만 짚어 줘.",
      },
      {
        role: "assistant",
        content:
          "예산 변동이 큰 항목, 승인 대기 안건, 다음 의사결정 시점 기준으로 나눠 요약할 수 있습니다.",
        note: "사업 계획 관련 문서를 근거로 요약",
      },
      {
        role: "user",
        content: "회의에서 바로 읽을 수 있게 짧게 바꿔 줘.",
      },
      {
        role: "assistant",
        content:
          "변동 폭이 큰 항목 2개와 이번 주 안에 결정해야 할 안건 1개만 남기는 형식으로 다시 정리했습니다.",
      },
    ],
    sources: [
      {
        href: appRoutes.knowledgeSpaceDetail("ks-strategy"),
        label: "2026 상반기 사업 계획",
        hint: "예산/우선순위 문서가 모여 있는 공간",
      },
      {
        href: appRoutes.documentDetail("update-security"),
        label: "보안 점검 체크리스트 v3",
        hint: "예산 승인 전 필수 체크 항목 예시",
      },
    ],
    followUps: [
      "리더 보고용 3줄 브리핑으로 줄여 줘",
      "승인 대기 안건만 따로 뽑아 줘",
      "리스크 항목 기준으로 다시 분류해 줘",
    ],
    metrics: [
      { label: "최근 응답 시각", value: "3일 전", hint: "보고용 요약 요청" },
      { label: "참조 문서", value: "2건", hint: "사업 계획 + 보안 필수 항목" },
      { label: "후속 질문", value: "3개", hint: "브리핑/리스크 재가공" },
    ],
  },
};

const knowledgeSpaceContent: Record<string, Omit<KnowledgeSpaceDetailPageData, "space">> = {
  "ks-strategy": {
    overview:
      "전사 전략, 예산, 우선순위 문서를 모아두는 공간입니다. 리더 브리핑이나 회의 전 사전 질의에 자주 사용됩니다.",
    stewardship: "전략기획팀이 문서 구조와 공개 범위를 관리하고, 월 1회 최신성 점검을 진행합니다.",
    coverageTopics: ["사업 목표와 분기 우선순위", "예산 승인 흐름", "경영 회의용 브리핑 자료"],
    operatingRules: [
      "리더십 리뷰가 끝난 문서만 전사 공용으로 공개합니다.",
      "예산 수치가 바뀌면 24시간 안에 변경 이력을 추가합니다.",
      "회의용 요약본과 원문 링크를 항상 함께 유지합니다.",
    ],
    linkedDocuments: [
      {
        href: appRoutes.documentDetail("update-security"),
        label: "보안 점검 체크리스트 v3",
        hint: "전사 공통 준수 항목 문서",
      },
      {
        href: appRoutes.documentDetail("update-onboarding"),
        label: "신입 입사자 온보딩 안내",
        hint: "공통 운영 문서 예시",
      },
    ],
    metrics: [
      { label: "문서 수", value: "3건", hint: "현재 홈 대시보드 기준" },
      { label: "운영 팀", value: "전략기획팀", hint: "문서 구조 및 공개 범위 관리" },
      { label: "최근 갱신", value: "2시간 전", hint: "회의 자료 최신본 반영" },
    ],
  },
  "ks-engineering": {
    overview:
      "기술 개발 본부의 운영 가이드, 장애 대응 문서, 배포 체크리스트를 묶어 두는 공간입니다.",
    stewardship: "플랫폼개발팀과 SRE가 함께 유지하며 장애 대응 문서는 배포 후 바로 갱신합니다.",
    coverageTopics: ["장애 대응 절차", "배포/백업 체크리스트", "운영 문서 최신 변경점"],
    operatingRules: [
      "운영 가이드 변경 시 관련 보고 템플릿까지 함께 수정합니다.",
      "배포 후 1영업일 내에 색인 상태를 다시 확인합니다.",
      "권한 범위는 기술 본부 공개를 기본값으로 둡니다.",
    ],
    linkedDocuments: [
      {
        href: appRoutes.documentDetail("update-sre"),
        label: "장애 보고서 작성 가이드",
        hint: "사후 분석과 영향 범위 기록 템플릿",
      },
      {
        href: appRoutes.documentDetail("update-security"),
        label: "보안 점검 체크리스트 v3",
        hint: "배포 전후 공통 점검 항목",
      },
    ],
    metrics: [
      { label: "문서 수", value: "12건", hint: "현재 홈 대시보드 기준" },
      { label: "운영 팀", value: "플랫폼개발팀", hint: "SRE 공동 운영" },
      { label: "최근 갱신", value: "방금 전", hint: "색인 작업 진행 중" },
    ],
  },
};

const documentContent: Record<string, Omit<DocumentDetailPageData, "document">> = {
  "update-security": {
    overview:
      "보안 점검 체크리스트 v3는 배포 전후 필수 확인 항목과 테스트 예외 규칙을 함께 정리한 문서입니다.",
    highlights: [
      "민감 권한 점검 항목이 추가되었습니다.",
      "테스트 환경 예외 규칙이 별도 섹션으로 분리되었습니다.",
      "검수 완료 후 운영 반영 시 확인해야 할 승인 흐름이 명확해졌습니다.",
    ],
    recommendedQuestions: [
      "이번 버전에서 꼭 달라진 항목만 요약해 줘",
      "배포 전에 확인해야 하는 체크포인트만 뽑아 줘",
      "예외 허용 조건을 정책 문장 기준으로 설명해 줘",
    ],
    relatedLinks: [
      {
        href: appRoutes.knowledgeSpaceDetail("ks-strategy"),
        label: "2026 상반기 사업 계획",
        hint: "전사 공통 정책이 모여 있는 공간",
      },
      {
        href: appRoutes.knowledgeSpaceDetail("ks-engineering"),
        label: "기술 개발 본부 가이드라인",
        hint: "운영/배포와 함께 보는 문서 공간",
      },
    ],
    metadata: [
      { label: "소유 팀", value: "보안팀" },
      { label: "공개 범위", value: "전사 공개" },
      { label: "최근 갱신", value: "18분 전" },
      { label: "문서 상태", value: "승인 완료" },
    ],
  },
  "update-onboarding": {
    overview:
      "신입 입사자 온보딩 안내는 첫 주 일정, 필수 서류, 교육 순서, 부서별 준비 항목을 한 페이지에 정리한 문서입니다.",
    highlights: [
      "입문 교육 일정과 필수 서명 문서 안내가 최신 버전으로 갱신되었습니다.",
      "직군별 장비/계정 준비 항목이 추가되었습니다.",
      "첫 주 담당 팀과 연락 창구가 표 형식으로 정리되었습니다.",
    ],
    recommendedQuestions: [
      "첫날에 바로 해야 하는 일만 다시 정리해 줘",
      "개발 직군 기준 준비물만 따로 보여 줘",
      "담당 팀과 연락 창구를 표로 만들어 줘",
    ],
    relatedLinks: [
      {
        href: appRoutes.chatDetail("chat-1"),
        label: "온보딩 질문 대화 보기",
        hint: "실제 검색 결과가 어떤 답변으로 이어졌는지 확인",
      },
      {
        href: appRoutes.knowledgeSpaceDetail("ks-strategy"),
        label: "전사 공용 안내 공간",
        hint: "공통 운영 문서가 모여 있는 공간",
      },
    ],
    metadata: [
      { label: "소유 팀", value: "인사팀" },
      { label: "공개 범위", value: "인사/리더 공개" },
      { label: "최근 갱신", value: "42분 전" },
      { label: "문서 상태", value: "배포 중" },
    ],
  },
  "update-sre": {
    overview:
      "장애 보고서 작성 가이드는 사후 분석 템플릿과 영향 범위 기록 방식을 표준화한 운영 문서입니다.",
    highlights: [
      "사후 분석 요약본에 서비스 영향 범위 필드가 추가되었습니다.",
      "재발 방지 항목을 액션 아이템 중심으로 재구성했습니다.",
      "운영팀 공지에 바로 붙일 수 있는 보고 문안 예시가 포함되었습니다.",
    ],
    recommendedQuestions: [
      "운영팀 공지용으로 5줄만 뽑아 줘",
      "백업 실패 사고에 맞는 작성 예시를 보여 줘",
      "이번 변경으로 필수 입력값이 뭐가 바뀌었는지 설명해 줘",
    ],
    relatedLinks: [
      {
        href: appRoutes.chatDetail("chat-2"),
        label: "운영 변경 요약 대화 보기",
        hint: "실제 질의와 응답 흐름 확인",
      },
      {
        href: appRoutes.knowledgeSpaceDetail("ks-engineering"),
        label: "기술 개발 본부 가이드라인",
        hint: "운영 절차를 함께 관리하는 지식 공간",
      },
    ],
    metadata: [
      { label: "소유 팀", value: "SRE팀" },
      { label: "공개 범위", value: "개발본부 공개" },
      { label: "최근 갱신", value: "1시간 전" },
      { label: "문서 상태", value: "색인 완료" },
    ],
  },
};

function buildFallbackChatDetail(chat: RecentChat): Omit<ChatDetailPageData, "chat"> {
  return {
    summary: "선택한 대화를 다시 이어서 보기 위한 상세 화면입니다.",
    answerSnapshot:
      "현재 저장된 요약이 없어도 최근 질문 제목과 연결된 채팅 흐름을 이어갈 수 있습니다.",
    transcript: [
      { role: "user", content: chat.title },
      {
        role: "assistant",
        content: "이 대화는 저장된 최근 기록을 기반으로 재진입할 수 있도록 준비된 화면입니다.",
      },
    ],
    sources: [],
    followUps: ["이 질문을 더 구체적으로 다시 작성해 줘", "관련 문서를 먼저 보여 줘"],
    metrics: [
      { label: "최근 응답 시각", value: chat.lastMessageRelative },
      { label: "연결 어시스턴트", value: chat.assistantName },
      { label: "상태", value: "대화 이어서 보기" },
    ],
  };
}

function buildFallbackKnowledgeSpace(
  space: KnowledgeSpaceSummary,
): Omit<KnowledgeSpaceDetailPageData, "space"> {
  return {
    overview: `${space.ownerTeam}에서 운영하는 지식 공간입니다. 권한 범위에 맞는 문서만 노출됩니다.`,
    stewardship: `${space.contactName}에게 운영 문의를 남길 수 있습니다.`,
    coverageTopics: ["팀 문서 요약", "자주 찾는 정책", "최근 갱신 문서"],
    operatingRules: [
      "최신 승인 버전만 검색에 노출합니다.",
      "권한 범위 밖 문서는 검색 결과에서 제외합니다.",
      "색인 상태는 운영 대시보드와 함께 관리합니다.",
    ],
    linkedDocuments: [],
    metrics: [
      { label: "문서 수", value: `${formatCount(space.docCount)}건` },
      { label: "공개 범위", value: space.visibility },
      { label: "최근 갱신", value: space.lastUpdatedRelative },
    ],
  };
}

function buildFallbackDocumentDetail(
  document: RecentUpdate,
): Omit<DocumentDetailPageData, "document"> {
  return {
    overview: document.summary,
    highlights: [
      `${document.team}에서 최근 갱신한 문서입니다.`,
      `공개 범위는 ${document.visibility} 기준으로 관리됩니다.`,
      "질문 화면에서 이 문서를 직접 출처로 참조할 수 있습니다.",
    ],
    recommendedQuestions: [
      "핵심 변경점만 짧게 요약해 줘",
      "이 문서가 필요한 상황을 예시로 설명해 줘",
      "관련 문서를 함께 보여 줘",
    ],
    relatedLinks: [],
    metadata: [
      { label: "소유 팀", value: document.team },
      { label: "공개 범위", value: document.visibility },
      { label: "최근 갱신", value: document.updatedRelative },
    ],
  };
}

export function getChatDetailPageData(
  dashboard: DashboardResponse,
  chatId: string,
): ChatDetailPageData | null {
  const chat = dashboard.recentChats.find((item) => item.id === chatId);
  if (!chat) {
    return null;
  }

  return {
    chat,
    ...(chatDetailContent[chatId] ?? buildFallbackChatDetail(chat)),
  };
}

export function getKnowledgeSpaceDetailPageData(
  dashboard: DashboardResponse,
  knowledgeSpaceId: string,
): KnowledgeSpaceDetailPageData | null {
  const space = dashboard.knowledgeSpaces.find((item) => item.id === knowledgeSpaceId);
  if (!space) {
    return null;
  }

  return {
    space,
    ...(knowledgeSpaceContent[knowledgeSpaceId] ?? buildFallbackKnowledgeSpace(space)),
  };
}

export function getDocumentDetailPageData(
  dashboard: DashboardResponse,
  documentId: string,
): DocumentDetailPageData | null {
  const document = dashboard.recentUpdates.find((item) => item.id === documentId);
  if (!document) {
    return null;
  }

  return {
    document,
    ...(documentContent[documentId] ?? buildFallbackDocumentDetail(document)),
  };
}
