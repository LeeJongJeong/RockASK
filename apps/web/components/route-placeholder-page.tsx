import Link from "next/link";

type PlaceholderAction = {
  href: string;
  label: string;
};

export function RoutePlaceholderPage({
  eyebrow,
  title,
  description,
  routePath,
  primaryAction,
  secondaryAction,
}: {
  eyebrow: string;
  title: string;
  description: string;
  routePath: string;
  primaryAction: PlaceholderAction;
  secondaryAction?: PlaceholderAction;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10 text-slate-900 sm:px-10 sm:py-14">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[36px] border border-white/70 bg-white/90 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-10">
        <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          {eyebrow}
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>

        <div className="mt-8 grid gap-4 rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-5 sm:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Route
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">{routePath}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Status
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">P0 placeholder ready</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={primaryAction.href}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {primaryAction.label}
          </Link>
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
