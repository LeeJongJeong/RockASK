import type { AlertSeverity, DashboardHealthStatus, KnowledgeSpaceStatus } from "@rockask/types";

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatResponseTime(milliseconds: number) {
  return `${(milliseconds / 1000).toFixed(1)}초`;
}

export function formatHealthStatusLabel(status: DashboardHealthStatus) {
  switch (status) {
    case "healthy":
      return "정상";
    case "warning":
      return "주의";
    case "error":
      return "오류";
  }
}

export function formatKnowledgeSpaceStatusLabel(status: KnowledgeSpaceStatus) {
  switch (status) {
    case "active":
      return "운영 중";
    case "indexing":
      return "색인 중";
    case "error":
      return "오류";
    case "archived":
      return "보관";
  }
}

export function formatAlertSeverityLabel(severity: AlertSeverity) {
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
