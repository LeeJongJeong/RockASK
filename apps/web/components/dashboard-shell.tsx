import type { DashboardResponse } from "@rockask/types";

import { LandingPageClient } from "@/components/landing/landing-page-client";

export function DashboardShell({ data }: { data: DashboardResponse }) {
  return <LandingPageClient data={data} />;
}
