export type DashboardHealthStatus = "healthy" | "warning" | "error";
export type KnowledgeSpaceStatus = "active" | "indexing" | "error" | "archived";
export type AlertSeverity = "info" | "warning" | "error" | "critical";
export type QuerySource = "dashboard_header" | "dashboard_hero" | "dashboard_prompt";

export interface DashboardProfile {
  name: string;
  team: string;
  initials: string;
}

export interface DashboardHealth {
  status: DashboardHealthStatus;
  lastSyncAt: string;
  lastSyncRelative: string;
  indexedToday: number;
  pendingIndexJobs: number;
  failedIngestionJobs: number;
  citationPolicy: string;
}

export interface DashboardSummary {
  searchableDocuments: number;
  queriesToday: number;
  avgResponseTimeMs: number;
  feedbackResolutionRate7d: number;
}

export interface DashboardScope {
  id: string;
  label: string;
  enabled: boolean;
  isDefault: boolean;
}

export interface KnowledgeSpaceSummary {
  id: string;
  name: string;
  ownerTeam: string;
  contactName: string;
  status: KnowledgeSpaceStatus;
  visibility: string;
  docCount: number;
  lastUpdatedRelative: string;
}

export interface RecentUpdate {
  id: string;
  title: string;
  team: string;
  updatedRelative: string;
  visibility: string;
  summary: string;
}

export interface RecommendedPrompt {
  id: string;
  title: string;
  prompt: string;
}

export interface RecentChat {
  id: string;
  title: string;
  assistantName: string;
  lastMessageRelative: string;
}

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  body: string;
}

export interface DashboardResponse {
  profile: DashboardProfile;
  health: DashboardHealth;
  summary: DashboardSummary;
  scopes: DashboardScope[];
  knowledgeSpaces: KnowledgeSpaceSummary[];
  recentUpdates: RecentUpdate[];
  recommendedPrompts: RecommendedPrompt[];
  recentChats: RecentChat[];
  alerts: SystemAlert[];
  meta: {
    source: "api" | "mock";
  };
}

export interface CreateQueryRequest {
  query: string;
  scope_id: string;
  source: QuerySource;
  prompt_template_id?: string | null;
}

export interface CreateQueryResponse {
  query_id: string;
  chat_id: string;
  redirect_url: string;
}

export interface UpdatePreferencesRequest {
  theme?: "system" | "light" | "dark";
  last_scope_id?: string | null;
}