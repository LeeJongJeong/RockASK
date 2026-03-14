import type { DashboardHealth } from "@rockask/types";

import { formatHealthStatusLabel } from "@/lib/dashboard-formatters";

const healthBadgeStyles = {
  healthy: "bg-emerald-500/15 text-emerald-300",
  warning: "bg-amber-500/15 text-amber-300",
  error: "bg-rose-500/15 text-rose-300",
} as const;

interface DataHealthCardProps {
  health: DashboardHealth;
  isRefreshing: boolean;
  refreshError: string | null;
  onRefresh: () => void;
}

export function DataHealthCard({
  health,
  isRefreshing,
  refreshError,
  onRefresh,
}: DataHealthCardProps) {
  const progress = Math.max(
    16,
    Math.min(100, 100 - health.pendingIndexJobs * 2 - health.failedIngestionJobs * 12),
  );
  const describedBy = ["data-health-status", refreshError ? "data-health-error" : null]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="rounded-[32px] border border-slate-200/70 bg-slate-950 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Data Health
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Search Pipeline Check</h2>
        </div>
        <div
          className={`rounded-2xl px-3 py-1 text-xs font-semibold ${healthBadgeStyles[health.status]}`}
        >
          {formatHealthStatusLabel(health.status)}
        </div>
      </div>
      <p
        id="data-health-status"
        aria-live="polite"
        className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-xs text-slate-300"
      >
        <span>
          {isRefreshing ? "Refreshing data..." : "Refreshes automatically every 60 seconds."}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full border border-white/10 px-3 py-1 font-semibold text-white disabled:cursor-wait disabled:opacity-70"
          disabled={isRefreshing}
          aria-describedby={describedBy || undefined}
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </p>
      {refreshError ? (
        <p id="data-health-error" role="alert" className="mt-3 text-xs text-rose-300">
          {refreshError}
        </p>
      ) : null}
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Last sync</span>
            <span className="font-semibold text-white">{health.lastSyncRelative}</span>
          </div>
          <div
            className="mt-3 h-2 rounded-full bg-white/10"
            role="progressbar"
            aria-label="Indexing progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-400">Indexed today: {health.indexedToday}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-slate-400">Pending jobs</p>
            <p className="mt-2 text-2xl font-semibold">{health.pendingIndexJobs}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-slate-400">Failed ingestions</p>
            <p className="mt-2 text-2xl font-semibold">{health.failedIngestionJobs}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Citation policy</span>
            <span className="font-semibold text-cyan-300">{health.citationPolicy}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Answer cards show source document, version, generation time, and access scope together.
          </p>
        </div>
      </div>
    </section>
  );
}
