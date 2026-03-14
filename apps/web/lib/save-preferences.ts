import { buildApiUrl } from "@/lib/api-url";

export interface SavePreferencesInput {
  theme?: "light" | "dark";
  lastScopeId?: string;
}

export async function savePreferences({ theme, lastScopeId }: SavePreferencesInput): Promise<void> {
  const body = {
    ...(theme ? { theme } : {}),
    ...(lastScopeId ? { last_scope_id: lastScopeId } : {}),
  };

  if (Object.keys(body).length === 0) {
    return;
  }

  const response = await fetch(buildApiUrl("/api/v1/preferences"), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Preferences request failed: ${response.status}`);
  }
}
