import type { DashboardResponse } from "@rockask/types";

import { buildApiUrl, getApiBaseUrl } from "@/lib/api-url";
import { mockDashboard } from "@/lib/mock-dashboard";

export async function getDashboard(): Promise<DashboardResponse> {
  if (!getApiBaseUrl()) {
    return mockDashboard;
  }

  try {
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
  } catch {
    return mockDashboard;
  }
}
