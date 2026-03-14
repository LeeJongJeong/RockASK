import type { SystemAlert } from "@rockask/types";
import Link from "next/link";

import { formatAlertSeverity } from "@/lib/dashboard-formatters";
import { appRoutes } from "@/lib/routes";

const navigationItems = [
  { label: "대시보드", href: appRoutes.dashboard },
  { label: "질문하기", href: appRoutes.chatNew },
  { label: "지식 베이스", href: appRoutes.knowledgeSpaces },
  { label: "전문 봇", href: appRoutes.assistants },
  { label: "수집 파이프라인", href: appRoutes.ingestion },
] as const;

export function SidebarNav({ alert }: { alert?: SystemAlert }) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200/70 bg-white/85 backdrop-blur xl:flex xl:flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-slate-200/70 px-7">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/80">
          <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
            <circle cx="20" cy="20" r="17" fill="#11A9E2" fillOpacity="0.96" />
            <circle cx="42" cy="20" r="17" fill="#F15A24" fillOpacity="0.96" />
            <circle cx="42" cy="42" r="17" fill="#FFD100" fillOpacity="0.96" />
            <circle cx="20" cy="42" r="17" fill="#008FD5" fillOpacity="0.96" />
            <circle cx="32" cy="32" r="11.5" fill="white" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Knowledge Hub
          </p>
          <p className="text-lg font-semibold">RockASK</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6 text-sm">
        {navigationItems.map((item, index) => (
          <Link
            key={item.label}
            href={item.href}
            className={
              index === 0
                ? "flex items-center rounded-2xl bg-blue-50 px-4 py-3 font-medium text-blue-700"
                : "flex items-center rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200/70 p-4">
        <div className="rounded-3xl bg-slate-950 p-5 text-slate-50 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">운영 알림</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                {alert?.body ?? "현재 운영 알림이 없습니다."}
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-300">
              {alert ? formatAlertSeverity(alert.severity) : "안내"}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 text-xs">
            <span>오늘 동기화 성공률</span>
            <span className="font-semibold text-emerald-300">98.6%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
