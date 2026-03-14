export type DashboardHealthStatus = "healthy" | "warning" | "error";
export type KnowledgeSpaceStatus = "active" | "indexing" | "error" | "archived";
export type AlertSeverity = "info" | "warning" | "error" | "critical";
export type QuerySource = "dashboard_header" | "dashboard_hero" | "dashboard_prompt";
export type ChatStatus = "ready" | "processing" | "archived" | "error";
export type ChatMessageRole = "user" | "assistant";
export type ChatSourceType = "document" | "knowledge_space";
export type DocumentStatus = "draft" | "indexing" | "approved" | "archived" | "error";
export type DocumentRelatedTargetType = "knowledge_space" | "chat" | "document";

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

export interface ChatListQueryParams {
  limit?: number;
  cursor?: string | null;
  status?: ChatStatus | null;
}

export interface ChatListItemDto {
  id: string;
  title: string;
  assistant_name: string;
  last_message_preview: string | null;
  last_message_at: string;
  last_message_relative: string;
  status: ChatStatus;
}

export interface ChatListResponse {
  items: ChatListItemDto[];
  next_cursor: string | null;
}

export interface ChatDetailHeaderDto {
  id: string;
  title: string;
  assistant_name: string;
  status: ChatStatus;
  created_at: string;
  last_message_at: string;
  last_message_relative: string;
}

export interface ChatMessageItemDto {
  id: string;
  role: ChatMessageRole;
  content: string;
  created_at: string;
  note: string | null;
}

export interface ChatSourceItemDto {
  id: string;
  source_type: ChatSourceType;
  target_id: string;
  label: string;
  hint: string;
}

export interface ChatFollowUpItemDto {
  id: string;
  text: string;
}

export interface ChatDetailResponse {
  chat: ChatDetailHeaderDto;
  summary: string;
  answer_snapshot: string;
  messages: ChatMessageItemDto[];
  sources: ChatSourceItemDto[];
  follow_ups: ChatFollowUpItemDto[];
}

export interface KnowledgeSpaceListQueryParams {
  limit?: number;
  cursor?: string | null;
  status?: KnowledgeSpaceStatus | null;
  visibility?: string | null;
}

export interface KnowledgeSpaceListItemDto {
  id: string;
  name: string;
  owner_team: string;
  contact_name: string;
  status: KnowledgeSpaceStatus;
  visibility: string;
  doc_count: number;
  last_updated_at: string;
  last_updated_relative: string;
}

export interface KnowledgeSpaceListResponse {
  items: KnowledgeSpaceListItemDto[];
  next_cursor: string | null;
}

export interface KnowledgeSpaceDetailHeaderDto {
  id: string;
  name: string;
  owner_team: string;
  contact_name: string;
  status: KnowledgeSpaceStatus;
  visibility: string;
  doc_count: number;
  last_updated_at: string;
  last_updated_relative: string;
}

export interface KnowledgeSpaceTopicItemDto {
  id: string;
  text: string;
}

export interface KnowledgeSpaceRuleItemDto {
  id: string;
  text: string;
}

export interface KnowledgeSpaceLinkedDocumentItemDto {
  id: string;
  target_type: "document";
  target_id: string;
  label: string;
  hint: string;
}

export interface KnowledgeSpaceDetailResponse {
  space: KnowledgeSpaceDetailHeaderDto;
  overview: string;
  stewardship: string;
  coverage_topics: KnowledgeSpaceTopicItemDto[];
  operating_rules: KnowledgeSpaceRuleItemDto[];
  linked_documents: KnowledgeSpaceLinkedDocumentItemDto[];
}

export interface DocumentDetailHeaderDto {
  id: string;
  title: string;
  owner_team: string;
  visibility: string;
  status: DocumentStatus;
  updated_at: string;
  updated_relative: string;
  summary: string;
}

export interface DocumentHighlightItemDto {
  id: string;
  text: string;
}

export interface DocumentRecommendedQuestionItemDto {
  id: string;
  text: string;
}

export interface DocumentRelatedLinkItemDto {
  id: string;
  target_type: DocumentRelatedTargetType;
  target_id: string;
  label: string;
  hint: string;
}

export interface DocumentDetailResponse {
  document: DocumentDetailHeaderDto;
  overview: string;
  highlights: DocumentHighlightItemDto[];
  recommended_questions: DocumentRecommendedQuestionItemDto[];
  related_links: DocumentRelatedLinkItemDto[];
}