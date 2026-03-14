import type { DashboardProfile, DashboardResponse } from "@rockask/types";

import { formatDashboardSource } from "@/lib/dashboard-formatters";

export function HeaderBar({
  profile,
  source,
  query,
  onQueryChange,
  onSubmit,
  errorMessage,
  isSubmitting,
}: {
  profile: DashboardProfile;
  source: DashboardResponse["meta"]["source"];
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  errorMessage: string | null;
  isSubmitting: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 xl:hidden"
          >
            ≡
          </button>
          <form
            className="relative w-full max-w-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              maxLength={500}
              placeholder="정책, 기술문서, 회의록, 표준 운영절차를 검색하세요"
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? "header-search-error" : undefined}
              disabled={isSubmitting}
              className={`h-12 w-full rounded-2xl border bg-slate-50 px-4 pr-24 text-sm outline-none transition focus:border-blue-500 focus:bg-white ${
                errorMessage ? "border-rose-400 focus:border-rose-500" : "border-slate-200"
              } ${isSubmitting ? "cursor-wait opacity-80" : ""}`}
            />
            <button type="submit" className="sr-only">
              검색
            </button>
            {isSubmitting ? (
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600">
                전송 중...
              </span>
            ) : null}
            {errorMessage ? (
              <p
                id="header-search-error"
                className="absolute left-0 top-full z-10 mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 shadow-sm"
              >
                {errorMessage}
              </p>
            ) : null}
          </form>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
            {formatDashboardSource(source)}
          </span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500"
          >
            ◐
          </button>
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500"
          >
            🔔
          </button>
          <div className="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:flex sm:items-center sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 font-semibold text-white">
              {profile.initials}
            </div>
            <div>
              <p className="text-sm font-semibold">{profile.name}</p>
              <p className="text-xs text-slate-500">{profile.team}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
