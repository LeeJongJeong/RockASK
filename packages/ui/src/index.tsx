import type { PropsWithChildren } from "react";

export function Panel({ children }: PropsWithChildren) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-6">{children}</div>;
}
