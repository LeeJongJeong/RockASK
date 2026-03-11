from pydantic import BaseModel


class DashboardProfile(BaseModel):
    name: str
    team: str
    initials: str


class DashboardHealth(BaseModel):
    status: str
    lastSyncAt: str
    lastSyncRelative: str
    indexedToday: int
    pendingIndexJobs: int
    failedIngestionJobs: int
    citationPolicy: str


class DashboardSummary(BaseModel):
    searchableDocuments: int
    queriesToday: int
    avgResponseTimeMs: int
    feedbackResolutionRate7d: float


class DashboardScope(BaseModel):
    id: str
    label: str
    enabled: bool
    isDefault: bool


class KnowledgeSpaceSummary(BaseModel):
    id: str
    name: str
    ownerTeam: str
    contactName: str
    status: str
    visibility: str
    docCount: int
    lastUpdatedRelative: str


class RecentUpdate(BaseModel):
    id: str
    title: str
    team: str
    updatedRelative: str
    visibility: str
    summary: str


class RecommendedPrompt(BaseModel):
    id: str
    title: str
    prompt: str


class RecentChat(BaseModel):
    id: str
    title: str
    assistantName: str
    lastMessageRelative: str


class SystemAlert(BaseModel):
    id: str
    severity: str
    title: str
    body: str


class DashboardMeta(BaseModel):
    source: str


class DashboardResponse(BaseModel):
    profile: DashboardProfile
    health: DashboardHealth
    summary: DashboardSummary
    scopes: list[DashboardScope]
    knowledgeSpaces: list[KnowledgeSpaceSummary]
    recentUpdates: list[RecentUpdate]
    recommendedPrompts: list[RecommendedPrompt]
    recentChats: list[RecentChat]
    alerts: list[SystemAlert]
    meta: DashboardMeta
