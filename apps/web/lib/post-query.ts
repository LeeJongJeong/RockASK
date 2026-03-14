import { buildApiUrl } from "@/lib/api-url";
import { chatDetailRoute } from "@/lib/routes";

export interface PostQueryInput {
  query: string;
  scopeId: string;
  source: "dashboard_header" | "dashboard_hero" | "dashboard_prompt";
  promptTemplateId?: string;
}

export interface PostQueryResult {
  queryId: string;
  chatId: string;
  redirectUrl: string;
}

// Temporary frontend fallback policy for local/dev environments.
// Real validation/auth errors should still surface to the UI.
function isQueryFallbackEnabled() {
  const override = process.env.NEXT_PUBLIC_ENABLE_QUERY_FALLBACK?.trim().toLowerCase();

  if (override === "true") {
    return true;
  }

  if (override === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

function shouldFallbackForStatus(status: number) {
  return status === 404 || status === 405 || status >= 500;
}

function createClientSideId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildFallbackQueryResult(): PostQueryResult {
  const chatId = createClientSideId("chat");

  return {
    queryId: createClientSideId("query"),
    chatId,
    redirectUrl: chatDetailRoute(chatId),
  };
}

export async function postQuery({
  query,
  scopeId,
  source,
  promptTemplateId,
}: PostQueryInput): Promise<PostQueryResult> {
  try {
    const response = await fetch(buildApiUrl("/api/v1/queries"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        scope_id: scopeId,
        source,
        prompt_template_id: promptTemplateId,
      }),
    });

    if (!response.ok) {
      if (isQueryFallbackEnabled() && shouldFallbackForStatus(response.status)) {
        return buildFallbackQueryResult();
      }

      throw new Error(`Query request failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      query_id: string;
      chat_id: string;
      redirect_url: string;
    };

    return {
      queryId: payload.query_id,
      chatId: payload.chat_id,
      redirectUrl: payload.redirect_url,
    };
  } catch (error) {
    if (isQueryFallbackEnabled() && error instanceof TypeError) {
      return buildFallbackQueryResult();
    }

    throw error;
  }
}
