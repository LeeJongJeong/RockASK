import type { DashboardScope } from "@rockask/types";

const heroCards = [
  { label: "Suggested", value: "Vacation policy summary and exception cases" },
  { label: "Template", value: "Draft a weekly update" },
  { label: "Reminder", value: "Mask sensitive data before upload" },
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
        Search only within your allowed scope
      </div>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Start a RAG workflow that finds internal knowledge fast and keeps the source visible
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
        Search policies, technical docs, and meeting notes within your access scope, then summarize
        the result with source references and sync freshness.
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
              Main query input
            </label>
            <input
              id="hero-search-input"
              type="text"
              value={queryValue}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Example: Summarize onboarding docs and required training"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500"
              aria-label="Main query input"
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={describedBy || undefined}
            />
            <p id="hero-search-status" className="sr-only" aria-live="polite">
              {isSubmitting ? "Sending the main query." : ""}
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
            {isSubmitting ? "Sending..." : "Start query"}
          </button>
        </div>
        <fieldset className="mt-4 flex flex-wrap gap-2">
          <legend className="sr-only">Search scope</legend>
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
