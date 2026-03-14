import type { RecommendedPrompt } from "@rockask/types";

import { SectionEmptyState } from "@/components/landing/section-empty-state";
import { appRoutes } from "@/lib/routes";

export function RecommendedPromptsSection({
  recommendedPrompts,
  errorMessage,
  submittingPromptId,
  onPromptSelect,
}: {
  recommendedPrompts: RecommendedPrompt[];
  errorMessage: string | null;
  submittingPromptId: string | null;
  onPromptSelect: (promptId: string, promptText: string) => void;
}) {
  const isSubmittingAnyPrompt = submittingPromptId !== null;

  return (
    <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">추천 프롬프트</h2>
          <p className="mt-1 text-sm text-slate-500">첫 화면에서 바로 시작할 수 있는 업무 질문</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          Prompt
        </span>
      </div>

      {recommendedPrompts.length === 0 ? (
        <div className="mt-5">
          <SectionEmptyState
            title="추천 프롬프트가 아직 없습니다."
            description="업무별 추천 질문이 준비되면 이 영역에서 바로 실행할 수 있습니다."
            actionHref={appRoutes.chatNew}
            actionLabel="새 질문 시작"
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {recommendedPrompts.map((item) => {
            const isSubmitting = submittingPromptId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                disabled={isSubmittingAnyPrompt}
                onClick={() => onPromptSelect(item.id, item.prompt)}
                className={`w-full rounded-2xl px-4 py-4 text-left text-sm font-medium transition ${
                  isSubmittingAnyPrompt
                    ? "cursor-wait bg-slate-100 text-slate-500"
                    : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                  {item.title}
                </span>
                <span className="mt-2 block">{item.prompt}</span>
                {isSubmitting ? (
                  <span className="mt-3 block text-xs font-semibold text-blue-600">전송 중...</span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {errorMessage ? (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 shadow-sm">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
