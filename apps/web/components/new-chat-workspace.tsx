"use client";

import type { DashboardScope, RecommendedPrompt } from "@rockask/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { postQuery } from "@/lib/post-query";
import { loadStoredPreferences, savePreferences } from "@/lib/save-preferences";

const MAX_QUERY_LENGTH = 500;

function normalizeQuery(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getDefaultScopeId(scopes: DashboardScope[]) {
  return scopes.find((scope) => scope.isDefault)?.id ?? scopes[0]?.id ?? "";
}

function getInitialScopeId(scopes: DashboardScope[]) {
  if (typeof window === "undefined") {
    return getDefaultScopeId(scopes);
  }

  const storedScopeId = loadStoredPreferences().last_scope_id;
  if (storedScopeId && scopes.some((scope) => scope.id === storedScopeId && scope.enabled)) {
    return storedScopeId;
  }

  return getDefaultScopeId(scopes);
}

interface NewChatWorkspaceProps {
  scopes: DashboardScope[];
  prompts: RecommendedPrompt[];
}

export function NewChatWorkspace({ scopes, prompts }: NewChatWorkspaceProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedScopeId, setSelectedScopeId] = useState(() => getInitialScopeId(scopes));
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleScopeSelect(scopeId: string) {
    setSelectedScopeId(scopeId);

    try {
      await savePreferences({ last_scope_id: scopeId });
    } catch {
      // Scope persistence should not block query submission.
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) {
      setError("질문을 입력해 주세요.");
      return;
    }

    if (normalizedQuery.length > MAX_QUERY_LENGTH) {
      setError(`질문은 ${MAX_QUERY_LENGTH}자 이내로 입력해 주세요.`);
      return;
    }

    if (!selectedScopeId) {
      setError("검색 범위를 먼저 선택해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await postQuery({
        query: normalizedQuery,
        scope_id: selectedScopeId,
        source: "dashboard_hero",
        prompt_template_id: selectedPromptId,
      });
      router.push(response.redirect_url);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "질문을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.85fr)]">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">질문 입력</span>
          <textarea
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedPromptId(null);
              setError(null);
            }}
            rows={8}
            placeholder="예: 이번 주 신규 입사자 온보딩에 필요한 문서와 첫 주 일정만 정리해 줘"
            className="mt-2 w-full rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
          />
        </label>

        <div>
          <p className="text-sm font-semibold text-slate-700">검색 범위</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {scopes.map((scope) => (
              <button
                key={scope.id}
                type="button"
                disabled={!scope.enabled}
                onClick={() => void handleScopeSelect(scope.id)}
                className={`inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                  scope.id === selectedScopeId
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
                } ${scope.enabled ? "" : "cursor-not-allowed opacity-50"}`}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className={`text-sm ${error ? "text-rose-600" : "text-slate-500"}`}>
            {error ??
              `선택한 범위는 홈 화면과 동일하게 저장됩니다. (${query.length}/${MAX_QUERY_LENGTH})`}
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? "질문 보내는 중..." : "질문 시작"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-5">
        <p className="text-sm font-semibold text-slate-900">바로 쓰는 질문 템플릿</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          아래 템플릿을 누르면 질문창에 바로 채워집니다. 필요하면 바로 수정해서 보내면 됩니다.
        </p>
        <div className="mt-4 space-y-3">
          {prompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              onClick={() => {
                setQuery(prompt.prompt);
                setSelectedPromptId(prompt.id);
                setError(null);
              }}
              className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                selectedPromptId === prompt.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-blue-300"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{prompt.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{prompt.prompt}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
