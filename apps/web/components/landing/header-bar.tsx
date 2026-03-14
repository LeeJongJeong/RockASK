import type { DashboardProfile, SystemAlert } from "@rockask/types";

import { AlertsDropdown } from "@/components/landing/alerts-dropdown";

interface HeaderBarProps {
  profile: DashboardProfile;
  alerts: SystemAlert[];
  sourceLabel: string;
  queryValue: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  unreadAlertCount: number;
  isAlertsOpen: boolean;
  isDarkTheme: boolean;
  themeButtonLabel: string;
  themeGlyph: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onThemeToggle: () => void;
  onAlertsToggle: () => void;
  onAlertsClose: () => void;
  onMobileNavOpen: () => void;
}

export function HeaderBar({
  profile,
  alerts,
  sourceLabel,
  queryValue,
  errorMessage,
  isSubmitting,
  unreadAlertCount,
  isAlertsOpen,
  isDarkTheme,
  themeButtonLabel,
  themeGlyph,
  onQueryChange,
  onSubmit,
  onThemeToggle,
  onAlertsToggle,
  onAlertsClose,
  onMobileNavOpen,
}: HeaderBarProps) {
  const describedBy = [errorMessage ? "header-search-error" : null, "header-search-status"]
    .filter(Boolean)
    .join(" ");

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="px-5 py-4 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <button
              type="button"
              className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 xl:hidden"
              aria-label="모바일 메뉴 열기"
              aria-haspopup="dialog"
              aria-controls="mobile-nav-drawer"
              onClick={onMobileNavOpen}
            >
              메뉴
            </button>
            <div className="min-w-0 flex-1">
              <form
                className="flex flex-col gap-3 lg:flex-row lg:items-start"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmit();
                }}
              >
                <div className="min-w-0 flex-1">
                  <label htmlFor="header-search-input" className="sr-only">
                    상단 검색
                  </label>
                  <input
                    id="header-search-input"
                    type="text"
                    value={queryValue}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="정책, 기술 문서, 회의록 등 사내 지식을 검색해 보세요"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    aria-label="상단 검색"
                    aria-invalid={Boolean(errorMessage)}
                    aria-describedby={describedBy || undefined}
                  />
                  <p id="header-search-status" className="sr-only" aria-live="polite">
                    {isSubmitting ? "검색 요청을 전송하는 중입니다." : ""}
                  </p>
                  {errorMessage ? (
                    <p id="header-search-error" role="alert" className="mt-2 text-xs text-rose-600">
                      {errorMessage}
                    </p>
                  ) : null}
                </div>
                <button
                  type="submit"
                  className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? "전송 중..." : "검색"}
                </button>
              </form>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
              {sourceLabel}
            </span>
            <button
              type="button"
              onClick={onThemeToggle}
              title={themeButtonLabel}
              aria-label={themeButtonLabel}
              aria-pressed={isDarkTheme}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500"
            >
              {themeGlyph}
            </button>
            <AlertsDropdown
              alerts={alerts}
              isOpen={isAlertsOpen}
              unreadCount={unreadAlertCount}
              onToggle={onAlertsToggle}
              onClose={onAlertsClose}
            />
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
      </div>
    </header>
  );
}
