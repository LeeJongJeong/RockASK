import type { DashboardScope } from "@rockask/types";

const heroCards = [
  { label: "추천 질문", value: "휴가 규정 요약과 예외 케이스" },
  { label: "업무 템플릿", value: "주간 보고서 초안 만들기" },
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
  const describedBy = [errorMessage ? "hero-search-error" : null, "hero-search-status"]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 px-6 py-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        권한 내 문서만 · 출처 포함
      </div>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
        필요한 문서, 검색 말고 그냥 물어보세요
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
        옆 사람한테 물어보기 애매할 때, 여기 먼저 물어보세요. 문서 기반으로 근거 있게 답합니다.
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
            <label htmlFor="hero-search-input" className="sr-only">
              메인 질문 입력
            </label>
            <input
              id="hero-search-input"
              type="text"
              value={queryValue}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="예: 온보딩 문서와 필수 교육 일정을 정리해 줘"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500"
              aria-label="메인 질문 입력"
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={describedBy || undefined}
            />
            <p id="hero-search-status" className="sr-only" aria-live="polite">
              {isSubmitting ? "메인 질문을 전송하는 중입니다." : ""}
            </p>
            {errorMessage ? (
              <p id="hero-search-error" role="alert" className="mt-2 text-xs text-rose-600">
                {errorMessage}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "전송 중..." : "질문 시작"}
          </button>
        </div>
        <fieldset className="mt-4 flex flex-wrap gap-2">
          <legend className="sr-only">검색 범위</legend>
          {scopes.map((scope) => (
            <button
              key={scope.id}
              type="button"
              disabled={!scope.enabled}
              onClick={() => onScopeSelect(scope.id)}
              aria-pressed={scope.id === selectedScopeId}
              aria-disabled={!scope.enabled}
              className={
                scope.id === selectedScopeId
                  ? "rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                  : "rounded-full bg-slate-200/70 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              }
            >
              {scope.label}
            </button>
          ))}
        </fieldset>
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
