import type { CreateQueryRequest, CreateQueryResponse } from "@rockask/types";

import { buildApiUrl, getApiBaseUrl } from "@/lib/api-url";
import { appRoutes } from "@/lib/routes";

function isQueryFallbackEnabled() {
  const forced = process.env.NEXT_PUBLIC_ENABLE_QUERY_FALLBACK?.trim().toLowerCase();
  if (forced === "true") {
    return true;
  }
  if (forced === "false") {
    return false;
  }
  return process.env.NODE_ENV !== "production";
}

function shouldFallbackForStatus(status: number) {
  return status === 404 || status === 405 || status >= 500;
}

function createClientSideId(prefix: string) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${randomPart}`;
}

function buildFallbackQueryResult(): CreateQueryResponse {
  const chatId = createClientSideId("chat");
  return {
    query_id: createClientSideId("query"),
    chat_id: chatId,
    redirect_url: appRoutes.chatDetail(chatId),
  };
}

export async function postQuery(payload: CreateQueryRequest): Promise<CreateQueryResponse> {
  if (!getApiBaseUrl()) {
    return buildFallbackQueryResult();
  }

  try {
    const response = await fetch(buildApiUrl("/api/v1/queries"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        ...payload,
        prompt_template_id: payload.prompt_template_id ?? null,
      }),
    });

    if (!response.ok) {
      if (isQueryFallbackEnabled() && shouldFallbackForStatus(response.status)) {
        return buildFallbackQueryResult();
      }

      throw new Error(`Query request failed: ${response.status}`);
    }

    return (await response.json()) as CreateQueryResponse;
  } catch (error) {
    if (isQueryFallbackEnabled() && error instanceof TypeError) {
      return buildFallbackQueryResult();
    }
    throw error;
  }
}
