import Link from "next/link";

interface SectionEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function SectionEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: SectionEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 leading-6">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
