"use client";

import type {
  DashboardResponse,
  QuerySource,
  RecommendedPrompt,
  UpdatePreferencesRequest,
} from "@rockask/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DataHealthCard } from "@/components/landing/data-health-card";
import { HeaderBar } from "@/components/landing/header-bar";
import { HeroSearchPanel } from "@/components/landing/hero-search-panel";
import { KnowledgeSpacesSection } from "@/components/landing/knowledge-spaces-section";
import { QuickActionsCard } from "@/components/landing/quick-actions-card";
import { RecentChatsSection } from "@/components/landing/recent-chats-section";
import { RecentUpdatesSection } from "@/components/landing/recent-updates-section";
import { RecommendedPromptsSection } from "@/components/landing/recommended-prompts-section";
import { SidebarNav } from "@/components/landing/sidebar-nav";
import { SummaryCards } from "@/components/landing/summary-cards";
import { postQuery } from "@/lib/post-query";
import { loadStoredPreferences, savePreferences } from "@/lib/save-preferences";

const MAX_QUERY_LENGTH = 500;

function normalizeQuery(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getDefaultScopeId(data: DashboardResponse) {
  return data.scopes.find((scope) => scope.isDefault)?.id ?? data.scopes[0]?.id ?? "";
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

function validateQuery(rawQuery: string, selectedScopeId: string) {
  const query = normalizeQuery(rawQuery);
  if (!query) {
    return "질문을 입력해 주세요.";
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return `질문은 ${MAX_QUERY_LENGTH}자 이하로 입력해 주세요.`;
  }
  if (!selectedScopeId) {
    return "검색 범위를 선택해 주세요.";
  }
  return null;
}

export function LandingPageClient({ data }: { data: DashboardResponse }) {
  const router = useRouter();
  const [selectedScopeId, setSelectedScopeId] = useState(() => getInitialScopeId(data));
  const [headerQuery, setHeaderQuery] = useState("");
  const [heroQuery, setHeroQuery] = useState("");
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [isHeaderSubmitting, setIsHeaderSubmitting] = useState(false);
  const [isHeroSubmitting, setIsHeroSubmitting] = useState(false);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  useEffect(() => {
    if (!data.scopes.some((scope) => scope.id === selectedScopeId && scope.enabled)) {
      setSelectedScopeId(getDefaultScopeId(data));
    }
  }, [data, selectedScopeId]);

  async function persistPreference(update: UpdatePreferencesRequest) {
    try {
      await savePreferences(update);
    } catch {
      // P0에서는 preference 저장 실패가 화면 사용 자체를 막지 않도록 한다.
    }
  }

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

  return (
    <div className="min-h-screen text-slate-900">
      <div className="flex min-h-screen overflow-hidden">
        <SidebarNav alert={data.alerts[0]} />

        <div className="flex min-h-screen flex-1 flex-col">
          <HeaderBar
            profile={data.profile}
            alerts={data.alerts}
            sourceLabel={data.meta.source === "api" ? "API connected" : "Mock mode"}
            queryValue={headerQuery}
            errorMessage={headerError}
            isSubmitting={isHeaderSubmitting}
            onQueryChange={setHeaderQuery}
            onSubmit={handleHeaderSubmit}
          />

          <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
              <HeroSearchPanel
                queryValue={heroQuery}
                errorMessage={heroError}
                isSubmitting={isHeroSubmitting}
                scopes={data.scopes}
                selectedScopeId={selectedScopeId}
                onQueryChange={setHeroQuery}
                onScopeSelect={handleScopeSelect}
                onSubmit={handleHeroSubmit}
              />

              <div className="space-y-6">
                <DataHealthCard health={data.health} />
                <QuickActionsCard />
              </div>
            </section>

            <SummaryCards data={data} />

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr_1fr]">
              <KnowledgeSpacesSection spaces={data.knowledgeSpaces} />
              <RecentUpdatesSection items={data.recentUpdates} />
              <div className="space-y-6">
                <RecommendedPromptsSection
                  prompts={data.recommendedPrompts}
                  activePromptId={activePromptId}
                  errorMessage={promptError}
                  onPromptSelect={handlePromptSelect}
                />
                <RecentChatsSection chats={data.recentChats} />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
