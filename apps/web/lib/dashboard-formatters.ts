import type {
  AlertSeverity,
  DashboardHealthStatus,
  DashboardResponse,
  KnowledgeSpaceStatus,
} from "@rockask/types";

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatResponseTimeMs(ms: number) {
  return `${(ms / 1000).toFixed(1)}초`;
}

export function formatDashboardSource(source: DashboardResponse["meta"]["source"]) {
  return source === "api" ? "API connected" : "Mock mode";
}

export function formatHealthStatus(status: DashboardHealthStatus) {
  switch (status) {
    case "healthy":
      return "정상 운영";
    case "warning":
      return "주의";
    case "error":
      return "오류";
  }
}

export function formatCitationPolicy(policy: string) {
  if (policy === "always_on") {
    return "항상 표시";
  }

  return policy;
}

export function formatAlertSeverity(severity: AlertSeverity) {
  switch (severity) {
    case "info":
      return "안내";
    case "warning":
      return "주의";
    case "error":
      return "오류";
    case "critical":
      return "긴급";
  }
}

export function formatKnowledgeSpaceStatus(status: KnowledgeSpaceStatus) {
  switch (status) {
    case "active":
      return "검색 가능";
    case "indexing":
      return "색인 중";
    case "error":
      return "점검 필요";
    case "archived":
      return "보관됨";
  }
}
