export function buildApiUrl(path: string) {
  const publicBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const serverBaseUrl =
    typeof window === "undefined" ? process.env.API_BASE_URL?.trim() : undefined;
  const baseUrl = publicBaseUrl || serverBaseUrl || "";

  return baseUrl ? `${baseUrl}${path}` : path;
}
