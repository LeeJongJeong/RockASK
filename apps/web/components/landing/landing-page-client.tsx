"use client";

import type {
  DashboardResponse,
  QuerySource,
  RecommendedPrompt,
  UpdatePreferencesRequest,
} from "@rockask/types";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useEffectEvent, useState } from "react";

import { DataHealthCard } from "@/components/landing/data-health-card";
import { HeaderBar } from "@/components/landing/header-bar";
import { HeroSearchPanel } from "@/components/landing/hero-search-panel";
import { KnowledgeSpacesSection } from "@/components/landing/knowledge-spaces-section";
import { MobileNavDrawer } from "@/components/landing/mobile-nav-drawer";
import { QuickActionsCard } from "@/components/landing/quick-actions-card";
import { RecentChatsSection } from "@/components/landing/recent-chats-section";
import { RecentUpdatesSection } from "@/components/landing/recent-updates-section";
import { RecommendedPromptsSection } from "@/components/landing/recommended-prompts-section";
import { SidebarNav } from "@/components/landing/sidebar-nav";
import { SummaryCards } from "@/components/landing/summary-cards";
import { fetchDashboardSnapshot } from "@/lib/get-dashboard";
import type { DashboardFixture } from "@/lib/mock-dashboard-fixtures";
import { postQuery } from "@/lib/post-query";
import { loadStoredPreferences, savePreferences } from "@/lib/save-preferences";

const MAX_QUERY_LENGTH = 500;
const DASHBOARD_REFRESH_INTERVAL = 60_000;

type ThemePreference = NonNullable<UpdatePreferencesRequest["theme"]>;
type ResolvedTheme = "light" | "dark";

function normalizeQuery(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getDefaultScopeId(data: DashboardResponse) {
  return data.scopes.find((scope) => scope.isDefault)?.id ?? data.scopes[0]?.id ?? "";
}

function getStoredThemePreference(): ThemePreference {
  return loadStoredPreferences().theme ?? "system";
}

function getInitialScopeId(data: DashboardResponse) {
  if (typeof window === "undefined") {
    return getDefaultScopeId(data);
  }

  const storedScopeId = loadStoredPreferences().last_scope_id;
  if (storedScopeId && data.scopes.some((scope) => scope.id === storedScopeId && scope.enabled)) {
    return storedScopeId;
  }

  return getDefaultScopeId(data);
}

function getAlertSignature(data: DashboardResponse["alerts"]) {
  return data.map((alert) => `${alert.id}:${alert.severity}:${alert.title}`).join("|");
}

function getSourceLabel(data: DashboardResponse, fixture?: DashboardFixture | null) {
  if (fixture === "empty") {
    return "목업 모드 / 빈 화면 확인";
  }

  return data.meta.source === "api" ? "API 연결됨" : "목업 모드";
}

function validateQuery(rawQuery: string, selectedScopeId: string) {
  const query = normalizeQuery(rawQuery);
  if (!query) {
    return "질문을 입력해 주세요.";
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return `질문은 ${MAX_QUERY_LENGTH}자 이내로 입력해 주세요.`;
  }
  if (!selectedScopeId) {
    return "검색 범위를 선택해 주세요.";
  }
  return null;
}

function resolveTheme(
  themePreference: ThemePreference,
  mediaQueryList: MediaQueryList | null,
): ResolvedTheme {
  if (themePreference === "system") {
    return mediaQueryList?.matches ? "dark" : "light";
  }
  return themePreference;
}

interface LandingPageClientProps {
  data: DashboardResponse;
  fixture?: DashboardFixture | null;
}

export function LandingPageClient({ data, fixture }: LandingPageClientProps) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(data);
  const [selectedScopeId, setSelectedScopeId] = useState(() => getDefaultScopeId(data));
  const [headerQuery, setHeaderQuery] = useState("");
  const [heroQuery, setHeroQuery] = useState("");
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isHeaderSubmitting, setIsHeaderSubmitting] = useState(false);
  const [isHeroSubmitting, setIsHeroSubmitting] = useState(false);
  const [isRefreshingDashboard, setIsRefreshingDashboard] = useState(false);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [unreadAlertCount, setUnreadAlertCount] = useState(data.alerts.length);
  const [dismissedAlertSignature, setDismissedAlertSignature] = useState("");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    getStoredThemePreference(),
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    if (!dashboard.scopes.some((scope) => scope.id === selectedScopeId && scope.enabled)) {
      setSelectedScopeId(getDefaultScopeId(dashboard));
    }
  }, [dashboard, selectedScopeId]);

  useEffect(() => {
    const nextScopeId = getInitialScopeId(dashboard);
    setSelectedScopeId((current) => (current === nextScopeId ? current : nextScopeId));
  }, [dashboard]);

  useEffect(() => {
    const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const nextResolvedTheme = resolveTheme(themePreference, mediaQueryList);
      setResolvedTheme(nextResolvedTheme);
      document.documentElement.dataset.theme = nextResolvedTheme;
      document.documentElement.style.colorScheme = nextResolvedTheme;
    }

    applyTheme();
    mediaQueryList.addEventListener("change", applyTheme);

    return () => {
      mediaQueryList.removeEventListener("change", applyTheme);
    };
  }, [themePreference]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshDashboard({ silent: true });
    }, DASHBOARD_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const alertSignature = getAlertSignature(dashboard.alerts);

    if (!dashboard.alerts.length) {
      setUnreadAlertCount(0);
      return;
    }

    if (isAlertsOpen) {
      setUnreadAlertCount(0);
      setDismissedAlertSignature(alertSignature);
      return;
    }

    if (alertSignature !== dismissedAlertSignature) {
      setUnreadAlertCount(dashboard.alerts.length);
    }
  }, [dashboard.alerts, dismissedAlertSignature, isAlertsOpen]);

  async function persistPreference(update: UpdatePreferencesRequest) {
    try {
      await savePreferences(update);
    } catch {
      // Preference save failures should not block the current landing interaction.
    }
  }

  const refreshDashboard = useEffectEvent(async (options?: { silent?: boolean }) => {
    setRefreshError(null);
    setIsRefreshingDashboard(true);

    try {
      const nextDashboard = await fetchDashboardSnapshot(fixture);
      startTransition(() => {
        setDashboard(nextDashboard);
      });
    } catch {
      if (!options?.silent) {
        setRefreshError("대시보드 상태를 새로 고치지 못했습니다.");
      }
    } finally {
      setIsRefreshingDashboard(false);
    }
  });

  async function executeQuery(rawQuery: string, source: QuerySource, promptTemplateId?: string) {
    const validationError = validateQuery(rawQuery, selectedScopeId);
    if (validationError) {
      throw new Error(validationError);
    }

    const response = await postQuery({
      query: normalizeQuery(rawQuery),
      scope_id: selectedScopeId,
      source,
      prompt_template_id: promptTemplateId ?? null,
    });

    router.push(response.redirect_url);
  }

  async function handleHeaderSubmit() {
    setHeaderError(null);
    setIsHeaderSubmitting(true);

    try {
      await executeQuery(headerQuery, "dashboard_header");
    } catch (error) {
      setHeaderError(error instanceof Error ? error.message : "검색 요청을 처리하지 못했습니다.");
    } finally {
      setIsHeaderSubmitting(false);
    }
  }

  async function handleHeroSubmit() {
    setHeroError(null);
    setIsHeroSubmitting(true);

    try {
      await executeQuery(heroQuery, "dashboard_hero");
    } catch (error) {
      setHeroError(error instanceof Error ? error.message : "질문을 시작하지 못했습니다.");
    } finally {
      setIsHeroSubmitting(false);
    }
  }

  async function handlePromptSelect(prompt: RecommendedPrompt) {
    setPromptError(null);
    setActivePromptId(prompt.id);

    try {
      await executeQuery(prompt.prompt, "dashboard_prompt", prompt.id);
    } catch (error) {
      setPromptError(
        error instanceof Error ? error.message : "추천 프롬프트를 실행하지 못했습니다.",
      );
    } finally {
      setActivePromptId(null);
    }
  }

  function handleScopeSelect(scopeId: string) {
    setSelectedScopeId(scopeId);
    void persistPreference({ last_scope_id: scopeId });
  }

  function handleThemeToggle() {
    const nextTheme: ThemePreference = resolvedTheme === "dark" ? "light" : "dark";
    setThemePreference(nextTheme);
    void persistPreference({ theme: nextTheme });
  }

  function handleAlertsToggle() {
    const alertSignature = getAlertSignature(dashboard.alerts);

    setIsAlertsOpen((current) => {
      const next = !current;
      if (next) {
        setUnreadAlertCount(0);
        setDismissedAlertSignature(alertSignature);
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen text-slate-900">
      <div className="flex min-h-screen overflow-hidden">
        <SidebarNav alert={dashboard.alerts[0]} />
        <MobileNavDrawer isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <HeaderBar
            profile={dashboard.profile}
            alerts={dashboard.alerts}
            sourceLabel={getSourceLabel(dashboard, fixture)}
            queryValue={headerQuery}
            errorMessage={headerError}
            isSubmitting={isHeaderSubmitting}
            unreadAlertCount={unreadAlertCount}
            isAlertsOpen={isAlertsOpen}
            isDarkTheme={resolvedTheme === "dark"}
            themeButtonLabel={resolvedTheme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            themeGlyph={resolvedTheme === "dark" ? "라" : "다"}
            onQueryChange={setHeaderQuery}
            onSubmit={handleHeaderSubmit}
            onThemeToggle={handleThemeToggle}
            onAlertsToggle={handleAlertsToggle}
            onAlertsClose={() => setIsAlertsOpen(false)}
            onMobileNavOpen={() => setIsMobileNavOpen(true)}
          />

          <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
              <HeroSearchPanel
                queryValue={heroQuery}
                errorMessage={heroError}
                isSubmitting={isHeroSubmitting}
                scopes={dashboard.scopes}
                selectedScopeId={selectedScopeId}
                onQueryChange={setHeroQuery}
                onScopeSelect={handleScopeSelect}
                onSubmit={handleHeroSubmit}
              />

              <div className="space-y-6">
                <DataHealthCard
                  health={dashboard.health}
                  isRefreshing={isRefreshingDashboard}
                  refreshError={refreshError}
                  onRefresh={() => void refreshDashboard()}
                />
                <QuickActionsCard />
              </div>
            </section>

            <SummaryCards data={dashboard} />

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr_1fr]">
              <KnowledgeSpacesSection spaces={dashboard.knowledgeSpaces} />
              <RecentUpdatesSection items={dashboard.recentUpdates} />
              <div className="space-y-6">
                <RecommendedPromptsSection
                  prompts={dashboard.recommendedPrompts}
                  activePromptId={activePromptId}
                  errorMessage={promptError}
                  onPromptSelect={handlePromptSelect}
                />
                <RecentChatsSection chats={dashboard.recentChats} />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
