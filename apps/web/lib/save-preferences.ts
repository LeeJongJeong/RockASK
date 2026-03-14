import type { UpdatePreferencesRequest } from "@rockask/types";

import { buildApiUrl, getApiBaseUrl } from "@/lib/api-url";

const STORAGE_KEY = "rockask:landing-preferences";

export function loadStoredPreferences(): UpdatePreferencesRequest {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    return JSON.parse(rawValue) as UpdatePreferencesRequest;
  } catch {
    return {};
  }
}

function persistStoredPreferences(update: UpdatePreferencesRequest) {
  if (typeof window === "undefined") {
    return;
  }

  const nextValue = {
    ...loadStoredPreferences(),
    ...update,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
}

export async function savePreferences(update: UpdatePreferencesRequest) {
  persistStoredPreferences(update);

  if (!getApiBaseUrl()) {
    return;
  }

  try {
    const response = await fetch(buildApiUrl("/api/v1/preferences"), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(update),
    });

    if (
      response.ok ||
      (process.env.NODE_ENV !== "production" && [404, 405].includes(response.status))
    ) {
      return;
    }

    throw new Error(`Preferences request failed: ${response.status}`);
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && error instanceof TypeError) {
      return;
    }
    throw error;
  }
}
