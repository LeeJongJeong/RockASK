import type { DashboardResponse } from "@rockask/types";

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

export function DashboardShell({
  data,
  selectedScopeId,
  headerQuery,
  onHeaderQueryChange,
  onHeaderSubmit,
  headerError,
  isSubmittingHeader,
  heroQuery,
  onHeroQueryChange,
  onHeroSubmit,
  heroError,
  isSubmittingHero,
  promptError,
  submittingPromptId,
  onPromptSelect,
  onScopeSelect,
}: {
  data: DashboardResponse;
  selectedScopeId: string | null;
  headerQuery: string;
  onHeaderQueryChange: (value: string) => void;
  onHeaderSubmit: () => void;
  headerError: string | null;
  isSubmittingHeader: boolean;
  heroQuery: string;
  onHeroQueryChange: (value: string) => void;
  onHeroSubmit: () => void;
  heroError: string | null;
  isSubmittingHero: boolean;
  promptError: string | null;
  submittingPromptId: string | null;
  onPromptSelect: (promptId: string, promptText: string) => void;
  onScopeSelect: (scopeId: string) => void;
}) {
  return (
    <div className="min-h-screen text-slate-900">
      <div className="flex min-h-screen overflow-hidden">
        <SidebarNav alert={data.alerts[0]} />

        <div className="flex min-h-screen flex-1 flex-col">
          <HeaderBar
            profile={data.profile}
            source={data.meta.source}
            query={headerQuery}
            onQueryChange={onHeaderQueryChange}
            onSubmit={onHeaderSubmit}
            errorMessage={headerError}
            isSubmitting={isSubmittingHeader}
          />

          <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
              <HeroSearchPanel
                scopes={data.scopes}
                selectedScopeId={selectedScopeId}
                query={heroQuery}
                onQueryChange={onHeroQueryChange}
                onScopeSelect={onScopeSelect}
                onSubmit={onHeroSubmit}
                errorMessage={heroError}
                isSubmitting={isSubmittingHero}
              />

              <div className="space-y-6">
                <DataHealthCard health={data.health} />
                <QuickActionsCard />
              </div>
            </section>

            <SummaryCards summary={data.summary} />

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr_1fr]">
              <KnowledgeSpacesSection knowledgeSpaces={data.knowledgeSpaces} />
              <RecentUpdatesSection recentUpdates={data.recentUpdates} />

              <section className="space-y-6">
                <RecommendedPromptsSection
                  recommendedPrompts={data.recommendedPrompts}
                  errorMessage={promptError}
                  submittingPromptId={submittingPromptId}
                  onPromptSelect={onPromptSelect}
                />
                <RecentChatsSection recentChats={data.recentChats} />
              </section>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
