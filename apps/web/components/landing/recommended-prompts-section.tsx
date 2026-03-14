import type { RecommendedPrompt } from "@rockask/types";

import { SectionEmptyState } from "@/components/landing/section-empty-state";

interface RecommendedPromptsSectionProps {
  prompts: RecommendedPrompt[];
  activePromptId: string | null;
  errorMessage: string | null;
  onPromptSelect: (prompt: RecommendedPrompt) => void;
}

export function RecommendedPromptsSection({
  prompts,
  activePromptId,
  errorMessage,
  onPromptSelect,
}: RecommendedPromptsSectionProps) {
  return (
    <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">추천 프롬프트</h2>
          <p className="mt-1 text-sm text-slate-500">첫 화면에서 바로 꺼내 쓰는 업무 질문</p>
        </div>
        <span className="text-blue-600">↗</span>
      </div>
      <div className="mt-5 space-y-3">
        {prompts.length === 0 ? (
          <SectionEmptyState
            title="추천 프롬프트가 없습니다."
            description="프롬프트 템플릿이 추가되면 이 영역에서 바로 실행할 수 있습니다."
          />
        ) : (
          prompts.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPromptSelect(item)}
              disabled={activePromptId === item.id}
              className="w-full rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-wait disabled:opacity-70"
              aria-busy={activePromptId === item.id}
            >
              <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                {item.title}
              </span>
              <span className="mt-2 block">
                {activePromptId === item.id ? "전송 중..." : item.prompt}
              </span>
            </button>
          ))
        )}
      </div>
      {errorMessage ? (
        <p role="alert" className="mt-3 text-xs text-rose-600">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
