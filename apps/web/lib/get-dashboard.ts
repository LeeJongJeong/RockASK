import type { DashboardResponse } from "@rockask/types";

import { buildApiUrl, getApiBaseUrl } from "@/lib/api-url";
import { mockDashboard } from "@/lib/mock-dashboard";
import { type DashboardFixture, getDashboardFixture } from "@/lib/mock-dashboard-fixtures";

async function fetchDashboardFromApi(): Promise<DashboardResponse> {
  const response = await fetch(buildApiUrl("/api/v1/dashboard"), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Dashboard request failed: ${response.status}`);
  }

  return (await response.json()) as DashboardResponse;
}

function resolveMockDashboard(fixture?: DashboardFixture | null): DashboardResponse {
  return getDashboardFixture(fixture) ?? mockDashboard;
}

export async function getDashboard(fixture?: DashboardFixture | null): Promise<DashboardResponse> {
  const fixtureDashboard = getDashboardFixture(fixture);
  if (fixtureDashboard) {
    return fixtureDashboard;
  }

  if (!getApiBaseUrl()) {
    return resolveMockDashboard(fixture);
  }

  try {
    return await fetchDashboardFromApi();
  } catch {
    return resolveMockDashboard(fixture);
  }
}

export async function fetchDashboardSnapshot(
  fixture?: DashboardFixture | null,
): Promise<DashboardResponse> {
  const fixtureDashboard = getDashboardFixture(fixture);
  if (fixtureDashboard) {
    return fixtureDashboard;
  }

  if (!getApiBaseUrl()) {
    return resolveMockDashboard(fixture);
  }

  try {
    return await fetchDashboardFromApi();
  } catch {
    return resolveMockDashboard(fixture);
  }
}
