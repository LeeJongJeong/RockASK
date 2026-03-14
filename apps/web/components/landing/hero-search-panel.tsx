import type { DashboardScope } from "@rockask/types";

const heroCards = [
  { label: "추천 질문", value: "휴가 규정 요약과 예외 케이스" },
  { label: "업무 템플릿", value: "장애 보고서 초안 만들기" },
  { label: "주의 안내", value: "민감 정보는 마스킹 후 업로드 권장" },
] as const;

interface HeroSearchPanelProps {
  queryValue: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  scopes: DashboardScope[];
  selectedScopeId: string;
  onQueryChange: (value: string) => void;
  onScopeSelect: (scopeId: string) => void;
  onSubmit: () => void;
}

export function HeroSearchPanel({
  queryValue,
  errorMessage,
  isSubmitting,
  scopes,
  selectedScopeId,
  onQueryChange,
  onScopeSelect,
  onSubmit,
}: HeroSearchPanelProps) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 px-6 py-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        내 권한 범위 내 문서만 검색
      </div>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
        필요한 사내 지식을 바로 찾고, 출처까지 확인하는 RAG 작업 시작 화면
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
        정책, 기술 문서, 회의록, 표준 운영절차를 부서별 권한에 맞춰 검색하고 요약합니다. 답변에는
        문서 출처와 최신 동기화 시각을 함께 표시합니다.
      </p>

      <form
        className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={queryValue}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="예: 신규 입사자 온보딩 절차와 필요한 문서 목록을 정리해줘"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500"
              aria-label="메인 질문 입력"
            />
            {errorMessage ? <p className="mt-2 text-xs text-rose-600">{errorMessage}</p> : null}
          </div>
          <button
            type="submit"
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "전송 중..." : "질문 시작"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {scopes.map((scope) => (
            <button
              key={scope.id}
              type="button"
              disabled={!scope.enabled}
              onClick={() => onScopeSelect(scope.id)}
              className={
                scope.id === selectedScopeId
                  ? "rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                  : "rounded-full bg-slate-200/70 px-3 py-1.5 text-xs font-medium text-slate-700"
              }
            >
              {scope.label}
            </button>
          ))}
        </div>
      </form>

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
    </section>
  );
}
