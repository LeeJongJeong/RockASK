"use client";

import type { DashboardResponse, DashboardScope } from "@rockask/types";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { DashboardShell } from "@/components/dashboard-shell";
import { postQuery } from "@/lib/post-query";
import { chatDetailRoute } from "@/lib/routes";
import { savePreferences } from "@/lib/save-preferences";

function getInitialSelectedScopeId(scopes: DashboardScope[]) {
  return (
    scopes.find((scope) => scope.enabled && scope.isDefault)?.id ??
    scopes.find((scope) => scope.enabled)?.id ??
    scopes[0]?.id ??
    null
  );
}

function normalizeQueryInput(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getQueryValidationError(query: string, selectedScopeId: string | null) {
  if (!query) {
    return "질문을 입력해 주세요.";
  }

  if (query.length > 500) {
    return "질문은 500자 이하로 입력해 주세요.";
  }

  if (!selectedScopeId) {
    return "검색 범위를 찾지 못했습니다. 페이지를 새로고침해 주세요.";
  }

  return null;
}

export function LandingPageClient({ data }: { data: DashboardResponse }) {
  const router = useRouter();
  const [selectedScopeId, setSelectedScopeId] = useState(() =>
    getInitialSelectedScopeId(data.scopes),
  );
  const [headerQuery, setHeaderQuery] = useState("");
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [isSubmittingHeader, setIsSubmittingHeader] = useState(false);
  const [heroQuery, setHeroQuery] = useState("");
  const [heroError, setHeroError] = useState<string | null>(null);
  const [isSubmittingHero, setIsSubmittingHero] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [submittingPromptId, setSubmittingPromptId] = useState<string | null>(null);

  function pushToQueryResult(redirectUrl: string) {
    startTransition(() => {
      router.push(redirectUrl);
    });
  }

  async function submitDashboardQuery({
    query,
    source,
    promptTemplateId,
    setError,
    setSubmitting,
  }: {
    query: string;
    source: "dashboard_header" | "dashboard_hero" | "dashboard_prompt";
    promptTemplateId?: string;
    setError: (value: string | null) => void;
    setSubmitting: (value: boolean) => void;
  }) {
    const normalizedQuery = normalizeQueryInput(query);
    const validationError = getQueryValidationError(normalizedQuery, selectedScopeId);

    if (validationError) {
      setError(validationError);
      return;
    }

    const scopeId = selectedScopeId;

    if (!scopeId) {
      setError("검색 범위를 찾지 못했습니다. 페이지를 새로고침해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await postQuery({
        query: normalizedQuery,
        scopeId,
        source,
        promptTemplateId,
      });

      const redirectUrl = result.redirectUrl || chatDetailRoute(result.chatId);
      pushToQueryResult(redirectUrl);
    } catch {
      setError("질문 시작에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePromptSelect(promptId: string, promptText: string) {
    const normalizedQuery = normalizeQueryInput(promptText);
    const validationError = getQueryValidationError(normalizedQuery, selectedScopeId);

    if (validationError) {
      setPromptError(validationError);
      return;
    }

    const scopeId = selectedScopeId;

    if (!scopeId) {
      setPromptError("검색 범위를 찾지 못했습니다. 페이지를 새로고침해 주세요.");
      return;
    }

    setSubmittingPromptId(promptId);
    setPromptError(null);

    try {
      const result = await postQuery({
        query: normalizedQuery,
        scopeId,
        source: "dashboard_prompt",
        promptTemplateId: promptId,
      });

      const redirectUrl = result.redirectUrl || chatDetailRoute(result.chatId);
      pushToQueryResult(redirectUrl);
    } catch {
      setPromptError("추천 프롬프트 실행에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmittingPromptId(null);
    }
  }

  function handleScopeSelect(scopeId: string) {
    const selectedScope = data.scopes.find((scope) => scope.id === scopeId);

    if (!selectedScope || !selectedScope.enabled || scopeId === selectedScopeId) {
      return;
    }

    setSelectedScopeId(scopeId);
    setHeaderError(null);
    setHeroError(null);
    setPromptError(null);

    void savePreferences({
      lastScopeId: scopeId,
    }).catch(() => undefined);
  }

  return (
    <DashboardShell
      data={data}
      selectedScopeId={selectedScopeId}
      headerQuery={headerQuery}
      onHeaderQueryChange={(value) => {
        setHeaderQuery(value);
        if (headerError) {
          setHeaderError(null);
        }
      }}
      onHeaderSubmit={() =>
        submitDashboardQuery({
          query: headerQuery,
          source: "dashboard_header",
          setError: setHeaderError,
          setSubmitting: setIsSubmittingHeader,
        })
      }
      headerError={headerError}
      isSubmittingHeader={isSubmittingHeader}
      heroQuery={heroQuery}
      onHeroQueryChange={(value) => {
        setHeroQuery(value);
        if (heroError) {
          setHeroError(null);
        }
      }}
      onHeroSubmit={() =>
        submitDashboardQuery({
          query: heroQuery,
          source: "dashboard_hero",
          setError: setHeroError,
          setSubmitting: setIsSubmittingHero,
        })
      }
      heroError={heroError}
      isSubmittingHero={isSubmittingHero}
      promptError={promptError}
      submittingPromptId={submittingPromptId}
      onPromptSelect={handlePromptSelect}
      onScopeSelect={handleScopeSelect}
    />
  );
}
