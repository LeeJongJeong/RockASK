import type { DashboardResponse } from "@rockask/types";

import { buildApiUrl } from "@/lib/api-url";
import { mockDashboard } from "@/lib/mock-dashboard";

export async function getDashboard(): Promise<DashboardResponse> {
  const dashboardUrl = buildApiUrl("/api/v1/dashboard");

  if (!dashboardUrl.startsWith("http")) {
    return mockDashboard;
  }

  try {
    const response = await fetch(dashboardUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Dashboard request failed: ${response.status}`);
    }

    const data = (await response.json()) as DashboardResponse;
    return data;
  } catch {
    return mockDashboard;
  }
}
