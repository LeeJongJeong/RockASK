import Link from "next/link";
import type { ReactNode } from "react";

import { appRoutes } from "@/lib/routes";

type PageActionTone = "primary" | "secondary";

interface PageAction {
  href: string;
  label: string;
  tone?: PageActionTone;
}

interface BreadcrumbItem {
  href?: string;
  label: string;
}

interface AppScreenShellProps {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageAction[];
  children: ReactNode;
  sidebar?: ReactNode;
}

const actionToneStyles: Record<PageActionTone, string> = {
  primary: "border-blue-600 bg-blue-600 text-white hover:border-blue-500 hover:bg-blue-500",
  secondary: "border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white",
};

export function AppScreenShell({
  eyebrow,
  title,
  description,
  breadcrumbs = [{ href: appRoutes.home, label: "홈" }],
  actions,
  children,
  sidebar,
}: AppScreenShellProps) {
  return (
    <main className="min-h-screen px-5 py-6 text-slate-900 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200/70 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_26%)]" />
          <div className="relative p-6 sm:p-10">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-xs text-slate-500"
            >
              {breadcrumbs.map((item, index) => (
                <span
                  key={`${item.href ?? "current"}-${item.label}`}
                  className="inline-flex items-center gap-2"
                >
                  {item.href ? (
                    <Link href={item.href} className="transition hover:text-slate-700">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-700">{item.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 ? <span aria-hidden="true">/</span> : null}
                </span>
              ))}
            </nav>

            <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  {eyebrow}
                </p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  {description}
                </p>
              </div>

              {actions && actions.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {actions.map((action) => (
                    <Link
                      key={`${action.href}-${action.label}`}
                      href={action.href}
                      className={`inline-flex min-h-11 items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${actionToneStyles[action.tone ?? "secondary"]}`}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.9fr)]">
          <div className="space-y-6">{children}</div>
          {sidebar ? <aside className="space-y-6">{sidebar}</aside> : null}
        </div>
      </div>
    </main>
  );
}

export function AppSectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AppMetricGrid({
  items,
}: {
  items: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5"
        >
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            {item.label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p>
          {item.hint ? <p className="mt-2 text-sm text-slate-500">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function AppInfoList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="space-y-4">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-3"
        >
          <dt className="text-sm text-slate-500">{item.label}</dt>
          <dd className="text-right text-sm font-medium text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AppPill({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "rose";
}) {
  const toneStyles = {
    slate: "border-slate-200 bg-slate-100 text-slate-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    rose: "border-rose-100 bg-rose-50 text-rose-700",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneStyles[tone]}`}
    >
      {children}
    </span>
  );
}

export function AppEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: PageAction;
}) {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      {action ? (
        <div className="mt-5">
          <Link
            href={action.href}
            className={`inline-flex min-h-11 items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${actionToneStyles[action.tone ?? "primary"]}`}
          >
            {action.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
