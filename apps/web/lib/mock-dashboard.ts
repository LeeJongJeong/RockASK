import type { DashboardResponse } from "@rockask/types";

export const mockDashboard: DashboardResponse = {
  profile: {
    name: "김개발",
    team: "플랫폼개발팀",
    initials: "김",
  },
  health: {
    status: "healthy",
    lastSyncAt: "2026-03-11T10:15:00+09:00",
    lastSyncRelative: "15분 전",
    indexedToday: 148,
    pendingIndexJobs: 12,
    failedIngestionJobs: 1,
    citationPolicy: "always_on",
  },
  summary: {
    searchableDocuments: 24860,
    queriesToday: 1284,
    avgResponseTimeMs: 6200,
    feedbackResolutionRate7d: 0.94,
  },
  scopes: [
    { id: "global", label: "전사 검색", enabled: true, isDefault: true },
    { id: "eng", label: "개발 문서", enabled: true, isDefault: false },
    { id: "hr", label: "인사 규정", enabled: true, isDefault: false },
    { id: "mine", label: "내 문서만", enabled: true, isDefault: false },
  ],
  knowledgeSpaces: [
    {
      id: "ks-strategy",
      name: "2026 상반기 사업계획서",
      ownerTeam: "전략기획실",
      contactName: "박OO",
      status: "active",
      visibility: "restricted",
      docCount: 3,
      lastUpdatedRelative: "2시간 전",
    },
    {
      id: "ks-engineering",
      name: "기술개발본부 가이드라인",
      ownerTeam: "플랫폼개발팀",
      contactName: "김OO",
      status: "indexing",
      visibility: "team",
      docCount: 12,
      lastUpdatedRelative: "방금 전",
    },
  ],
  recentUpdates: [
    {
      id: "update-security",
      title: "보안 점검 체크리스트 v3",
      team: "보안팀",
      updatedRelative: "18분 전",
      visibility: "전사 공개",
      summary: "월간 점검 항목과 시스템별 예외 규칙이 추가되었습니다.",
    },
    {
      id: "update-onboarding",
      title: "신규 입사자 온보딩 절차",
      team: "인사팀",
      updatedRelative: "42분 전",
      visibility: "인사/리더 공개",
      summary: "입문 교육 일정과 필수 서명 서류 안내가 갱신되었습니다.",
    },
    {
      id: "update-sre",
      title: "장애 보고서 작성 가이드",
      team: "SRE팀",
      updatedRelative: "1시간 전",
      visibility: "개발본부 공개",
      summary: "사후 분석 템플릿과 영향 범위 표기가 표준화되었습니다.",
    },
  ],
  recommendedPrompts: [
    {
      id: "prompt-onboarding",
      title: "온보딩 패키지 정리",
      prompt: "신규 입사자 온보딩 문서와 교육 일정을 한 번에 정리해줘",
    },
    {
      id: "prompt-sre",
      title: "장애 대응 변경사항",
      prompt: "최근 30일 장애 대응 절차 변경사항을 요약해줘",
    },
    {
      id: "prompt-vacation",
      title: "휴가 규정 예외",
      prompt: "휴가 규정에서 팀장 승인 예외 케이스만 찾아줘",
    },
  ],
  recentChats: [
    {
      id: "chat-1",
      title: "신규 입사자 연차 발생 기준이 어떻게 되나?",
      assistantName: "사내 규정 봇",
      lastMessageRelative: "오늘 10:30",
    },
    {
      id: "chat-2",
      title: "아일랜드 서버 백업 정책 핵심만 요약해줘",
      assistantName: "기술 가이드 봇",
      lastMessageRelative: "어제",
    },
    {
      id: "chat-3",
      title: "Q3 마케팅 예산 문서에서 승인 절차만 뽑아줘",
      assistantName: "내 지식 베이스",
      lastMessageRelative: "3일 전",
    },
  ],
  alerts: [
    {
      id: "alert-sync",
      severity: "warning",
      title: "수집 실패 1건",
      body: "권한이 없는 문서는 검색 결과에서 자동 제외됩니다.",
    },
  ],
  meta: {
    source: "mock",
  },
};
