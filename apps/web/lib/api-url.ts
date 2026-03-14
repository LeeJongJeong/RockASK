const configuredApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? process.env.API_BASE_URL?.trim() ?? "";

export function getApiBaseUrl() {
  return configuredApiBaseUrl || null;
}

export function buildApiUrl(path: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new Error("API base URL is not configured.");
  }

  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
