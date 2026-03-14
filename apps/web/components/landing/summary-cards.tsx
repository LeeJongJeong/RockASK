import type { DashboardResponse } from "@rockask/types";

import { formatPercent, formatResponseTime } from "@/lib/dashboard-formatters";

export function SummaryCards({ data }: { data: DashboardResponse }) {
  const defaultScopeLabel = data.scopes.find((scope) => scope.isDefault)?.label ?? "전사 검색";
  const cards = [
    {
      label: "검색 가능 문서",
      value: data.summary.searchableDocuments.toLocaleString(),
      helper: data.meta.source === "api" ? "실데이터 기준" : "mock 데이터 기준",
    },
    {
      label: "오늘 질의 수",
      value: data.summary.queriesToday.toLocaleString(),
      helper: `기본 범위: ${defaultScopeLabel}`,
    },
    {
      label: "평균 응답 시간",
      value: formatResponseTime(data.summary.avgResponseTimeMs),
      helper: "출처 포함 기준",
    },
    {
      label: "피드백 처리율",
      value: formatPercent(data.summary.feedbackResolutionRate7d),
      helper: "최근 7일 기준",
    },
  ] as const;

  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {card.label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
          <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
        </div>
      ))}
    </section>
  );
}
