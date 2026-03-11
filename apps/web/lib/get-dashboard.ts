import type { DashboardResponse } from "@rockask/types";

import { mockDashboard } from "@/lib/mock-dashboard";

const defaultApiBaseUrl = process.env.API_BASE_URL?.trim();

export async function getDashboard(): Promise<DashboardResponse> {
  if (!defaultApiBaseUrl) {
    return mockDashboard;
  }

  try {
    const response = await fetch(`${defaultApiBaseUrl}/api/v1/dashboard`, {
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
