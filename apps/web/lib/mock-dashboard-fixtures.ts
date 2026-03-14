import type { DashboardResponse } from "@rockask/types";

import { mockDashboard } from "@/lib/mock-dashboard";

export type DashboardFixture = "empty";

const emptyDashboardFixture: DashboardResponse = {
  ...mockDashboard,
  health: {
    ...mockDashboard.health,
    indexedToday: 0,
    pendingIndexJobs: 0,
    failedIngestionJobs: 0,
  },
  summary: {
    ...mockDashboard.summary,
    searchableDocuments: 0,
    queriesToday: 0,
    avgResponseTimeMs: 0,
    feedbackResolutionRate7d: 0,
  },
  knowledgeSpaces: [],
  recentUpdates: [],
  recommendedPrompts: [],
  recentChats: [],
  alerts: [],
};

const dashboardFixtures: Record<DashboardFixture, DashboardResponse> = {
  empty: emptyDashboardFixture,
};

export function normalizeDashboardFixture(
  value?: string | string[] | null,
): DashboardFixture | null {
  const fixture = Array.isArray(value) ? value[0] : value;

  if (fixture === "empty") {
    return fixture;
  }

  return null;
}

export function getDashboardFixture(fixture?: DashboardFixture | null): DashboardResponse | null {
  if (!fixture) {
    return null;
  }

  return dashboardFixtures[fixture] ?? null;
}
