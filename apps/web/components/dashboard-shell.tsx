import type { DashboardHealthStatus, DashboardResponse, KnowledgeSpaceStatus } from "@rockask/types";

const healthBadgeStyles: Record<DashboardHealthStatus, string> = {
  healthy: "bg-emerald-500/15 text-emerald-300",
  warning: "bg-amber-500/15 text-amber-300",
  error: "bg-rose-500/15 text-rose-300",
};

const knowledgeSpaceStyles: Record<KnowledgeSpaceStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  indexing: "bg-blue-100 text-blue-700",
  error: "bg-rose-100 text-rose-700",
  archived: "bg-slate-200 text-slate-700",
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatSeconds(ms: number) {
  return `${(ms / 1000).toFixed(1)}초`;
}

export function DashboardShell({ data }: { data: DashboardResponse }) {
  const heroCards = [
    { label: "추천 질문", value: "휴가 규정 요약과 예외 케이스" },
    { label: "업무 템플릿", value: "장애 보고서 초안 만들기" },
    { label: "주의 안내", value: "민감 정보는 마스킹 후 업로드 권장" },
  ];

  const summaryCards = [
    {
      label: "검색 가능 문서",
      value: data.summary.searchableDocuments.toLocaleString(),
      helper: "전일 대비 +352",
    },
    {
      label: "오늘 질의 수",
      value: data.summary.queriesToday.toLocaleString(),
      helper: "가장 많은 범위: 개발 문서",
    },
    {
      label: "평균 응답 시간",
      value: formatSeconds(data.summary.avgResponseTimeMs),
      helper: "출처 포함 기준",
    },
    {
      label: "피드백 처리율",
      value: formatPercent(data.summary.feedbackResolutionRate7d),
      helper: "최근 7일 기준",
    },
  ];

  return (
    <div className="min-h-screen text-slate-900">
      <div className="flex min-h-screen overflow-hidden">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200/70 bg-white/85 backdrop-blur xl:flex xl:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-200/70 px-7">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/80">
              <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
                <circle cx="20" cy="20" r="17" fill="#11A9E2" fillOpacity="0.96" />
                <circle cx="42" cy="20" r="17" fill="#F15A24" fillOpacity="0.96" />
                <circle cx="42" cy="42" r="17" fill="#FFD100" fillOpacity="0.96" />
                <circle cx="20" cy="42" r="17" fill="#008FD5" fillOpacity="0.96" />
                <circle cx="32" cy="32" r="11.5" fill="white" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Knowledge Hub
              </p>
              <p className="text-lg font-semibold">RockASK</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6 text-sm">
            {[
              "대시보드",
              "질문하기",
              "지식 베이스",
              "전문 봇",
              "수집 파이프라인",
            ].map((item, index) => (
              <a
                key={item}
                href="#"
                className={
                  index === 0
                    ? "flex items-center rounded-2xl bg-blue-50 px-4 py-3 font-medium text-blue-700"
                    : "flex items-center rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                }
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="border-t border-slate-200/70 p-4">
            <div className="rounded-3xl bg-slate-950 p-5 text-slate-50 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">운영 알림</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    {data.alerts[0]?.body ?? "현재 운영 알림이 없습니다."}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                  {data.alerts[0]?.severity ?? "info"}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 text-xs">
                <span>오늘 동기화 성공률</span>
                <span className="font-semibold text-emerald-300">98.6%</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
            <div className="flex h-20 items-center justify-between gap-4 px-5 sm:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 xl:hidden">
                  ≡
                </button>
                <div className="relative w-full max-w-2xl">
                  <input
                    type="text"
                    placeholder="정책, 기술문서, 회의록, 표준 운영절차를 검색하세요"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    readOnly
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
                  {data.meta.source === "api" ? "API connected" : "Mock mode"}
                </span>
                <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500">
                  ◐
                </button>
                <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500">
                  🔔
                </button>
                <div className="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:flex sm:items-center sm:gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 font-semibold text-white">
                    {data.profile.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{data.profile.name}</p>
                    <p className="text-xs text-slate-500">{data.profile.team}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
              <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 px-6 py-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  내 권한 범위 내 문서만 검색
                </div>
                <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  필요한 사내 지식을 바로 찾고, 출처까지 확인하는 RAG 작업 시작 화면
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  정책, 기술 문서, 회의록, 표준 운영절차를 부서별 권한에 맞춰 검색하고
                  요약합니다. 답변에는 문서 출처와 최신 동기화 시각을 함께 표시합니다.
                </p>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <input
                      type="text"
                      placeholder="예: 신규 입사자 온보딩 절차와 필요한 문서 목록을 정리해줘"
                      className="h-14 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500"
                      readOnly
                    />
                    <button className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white">
                      질문 시작
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {data.scopes.map((scope) => (
                      <span
                        key={scope.id}
                        className={
                          scope.isDefault
                            ? "rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                            : "rounded-full bg-slate-200/70 px-3 py-1.5 text-xs font-medium text-slate-700"
                        }
                      >
                        {scope.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {heroCards.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <section className="rounded-[32px] border border-slate-200/70 bg-slate-950 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Data Health
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">검색 신뢰도 체크</h2>
                    </div>
                    <div className={`rounded-2xl px-3 py-1 text-xs font-semibold ${healthBadgeStyles[data.health.status]}`}>
                      {data.health.status}
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">마지막 동기화</span>
                        <span className="font-semibold text-white">{data.health.lastSyncRelative}</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <div className="h-2 w-[86%] rounded-full bg-emerald-400" />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        오늘 새로 반영된 문서 {data.health.indexedToday}건
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs text-slate-400">색인 대기</p>
                        <p className="mt-2 text-2xl font-semibold">{data.health.pendingIndexJobs}건</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs text-slate-400">수집 실패</p>
                        <p className="mt-2 text-2xl font-semibold">{data.health.failedIngestionJobs}건</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">출처 표기 정책</span>
                        <span className="font-semibold text-cyan-300">{data.health.citationPolicy}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        답변 카드에 문서명, 버전, 생성 시각, 접근 권한 범위를 함께 노출합니다.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">즉시 실행</p>
                      <p className="mt-1 text-xs text-slate-500">가장 많이 쓰는 첫 화면 액션</p>
                    </div>
                    <span className="text-blue-600">⚡</span>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {[
                      ["새 질문 시작", "전사 문서에서 바로 검색"],
                      ["문서 업로드", "PDF, Word, PPT, 위키 반영"],
                      ["컬렉션 관리", "팀별 지식 공간과 접근 권한 설정"],
                      ["오답 신고", "출처 이상, 권한 오류, 부정확 답변 접수"],
                    ].map(([title, helper]) => (
                      <button
                        key={title}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-500 hover:bg-blue-50"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">{title}</span>
                          <span className="block text-xs text-slate-500">{helper}</span>
                        </span>
                        <span className="text-slate-400">→</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr_1fr]">
              <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">주요 지식 공간</h2>
                    <p className="mt-1 text-sm text-slate-500">업무별로 가장 많이 접근하는 컬렉션 상태</p>
                  </div>
                  <a href="#" className="text-sm font-medium text-blue-700">
                    전체 보기
                  </a>
                </div>
                <div className="mt-5 space-y-4">
                  {data.knowledgeSpaces.map((space) => (
                    <article key={space.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{space.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            문서 {space.docCount}개 · 소유 팀: {space.ownerTeam} · 마지막 업데이트 {space.lastUpdatedRelative}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${knowledgeSpaceStyles[space.status]}`}>
                          {space.status}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">공개 범위</p>
                          <p className="mt-1 text-sm font-medium text-slate-900">{space.visibility}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">상태</p>
                          <p className="mt-1 text-sm font-medium text-slate-900">{space.status}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">문의 담당</p>
                          <p className="mt-1 text-sm font-medium text-slate-900">{space.contactName}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">최근 업데이트</h2>
                    <p className="mt-1 text-sm text-slate-500">반영 직후 확인할 가치가 큰 콘텐츠</p>
                  </div>
                  <span className="text-blue-600">↺</span>
                </div>
                <div className="mt-5 space-y-3">
                  {data.recentUpdates.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.team} · {item.updatedRelative} · {item.visibility}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">추천 프롬프트</h2>
                      <p className="mt-1 text-sm text-slate-500">첫 화면에서 바로 누를 수 있는 업무 질문</p>
                    </div>
                    <span className="text-blue-600">✦</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {data.recommendedPrompts.map((item) => (
                      <button
                        key={item.id}
                        className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                          {item.title}
                        </span>
                        <span className="mt-2 block">{item.prompt}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">최근 채팅</h2>
                      <p className="mt-1 text-sm text-slate-500">다시 이어보기 쉬운 질문 흐름</p>
                    </div>
                    <a href="#" className="text-sm font-medium text-blue-700">
                      전체 보기
                    </a>
                  </div>
                  <div className="mt-5 space-y-3">
                    {data.recentChats.map((chat) => (
                      <article key={chat.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-500">
                        <p className="text-sm font-semibold text-slate-900">{chat.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {chat.assistantName} · {chat.lastMessageRelative}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              </section>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
