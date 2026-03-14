import type { DashboardHealth, DashboardHealthStatus } from "@rockask/types";

import { formatCitationPolicy, formatHealthStatus } from "@/lib/dashboard-formatters";

const healthBadgeStyles: Record<DashboardHealthStatus, string> = {
  healthy: "bg-emerald-500/15 text-emerald-300",
  warning: "bg-amber-500/15 text-amber-300",
  error: "bg-rose-500/15 text-rose-300",
};

export function DataHealthCard({ health }: { health: DashboardHealth | null | undefined }) {
  if (!health) {
    return (
      <section className="rounded-[32px] border border-slate-200/70 bg-slate-950 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Data Health
          </p>
          <h2 className="mt-2 text-2xl font-semibold">검색 신뢰도 체크</h2>
        </div>
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 px-5 py-6">
          <p className="text-sm font-semibold text-white">
            아직 데이터 상태를 불러오지 못했습니다.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            동기화 현황, 색인 대기, 수집 실패 수는 데이터 소스가 연결되면 이 영역에 표시됩니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-slate-200/70 bg-slate-950 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Data Health
          </p>
          <h2 className="mt-2 text-2xl font-semibold">검색 신뢰도 체크</h2>
        </div>
        <div
          className={`rounded-2xl px-3 py-1 text-xs font-semibold ${healthBadgeStyles[health.status]}`}
        >
          {formatHealthStatus(health.status)}
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">마지막 동기화</span>
            <span className="font-semibold text-white">{health.lastSyncRelative}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div className="h-2 w-[86%] rounded-full bg-emerald-400" />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            오늘 새로 반영된 문서 {health.indexedToday}건
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-slate-400">색인 대기</p>
            <p className="mt-2 text-2xl font-semibold">{health.pendingIndexJobs}건</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-slate-400">수집 실패</p>
            <p className="mt-2 text-2xl font-semibold">{health.failedIngestionJobs}건</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">출처 표기 정책</span>
            <span className="font-semibold text-cyan-300">
              {formatCitationPolicy(health.citationPolicy)}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            답변 카드에 문서명, 버전, 생성 시각, 접근 권한 범위를 함께 노출합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
