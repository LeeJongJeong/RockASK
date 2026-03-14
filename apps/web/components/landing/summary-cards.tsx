import type { DashboardSummary } from "@rockask/types";

import { SectionEmptyState } from "@/components/landing/section-empty-state";
import { formatPercent, formatResponseTimeMs } from "@/lib/dashboard-formatters";

export function SummaryCards({ summary }: { summary: DashboardSummary | null | undefined }) {
  if (!summary) {
    return (
      <section className="mt-6">
        <SectionEmptyState
          title="아직 KPI 요약이 없습니다."
          description="검색 가능 문서 수, 오늘 질의 수, 평균 응답 시간, 피드백 처리율이 연결되면 이 영역에 표시됩니다."
        />
      </section>
    );
  }

  const summaryCards = [
    {
      label: "검색 가능 문서",
      value: summary.searchableDocuments.toLocaleString(),
      helper: "전일 대비 +352",
    },
    {
      label: "오늘 질의 수",
      value: summary.queriesToday.toLocaleString(),
      helper: "가장 많은 범위: 개발 문서",
    },
    {
      label: "평균 응답 시간",
      value: formatResponseTimeMs(summary.avgResponseTimeMs),
      helper: "출처 포함 기준",
    },
    {
      label: "피드백 처리율",
      value: formatPercent(summary.feedbackResolutionRate7d),
      helper: "최근 7일 기준",
    },
  ];

  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
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
