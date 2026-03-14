import type { DashboardResponse } from "@rockask/types";

import { LandingPageClient } from "@/components/landing/landing-page-client";
import type { DashboardFixture } from "@/lib/mock-dashboard-fixtures";

interface DashboardShellProps {
  data: DashboardResponse;
  fixture?: DashboardFixture | null;
}

export function DashboardShell({ data, fixture }: DashboardShellProps) {
  return <LandingPageClient data={data} fixture={fixture} />;
}
