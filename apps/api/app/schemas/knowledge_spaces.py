from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

KnowledgeSpaceStatus = Literal["active", "indexing", "error", "archived"]
KnowledgeSpaceLinkedDocumentTargetType = Literal["document"]


def _normalize_text(value: str) -> str:
    return " ".join(value.split()).strip()


class KnowledgeSpaceListQueryParams(BaseModel):
    limit: int = Field(default=20, ge=1, le=50)
    cursor: str | None = None
    status: KnowledgeSpaceStatus | None = None
    visibility: str | None = None

    @field_validator("cursor", "visibility", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = _normalize_text(value)
        return normalized or None


class KnowledgeSpaceListItem(BaseModel):
    id: str
    name: str
    owner_team: str
    contact_name: str
    status: KnowledgeSpaceStatus
    visibility: str
    doc_count: int
    last_updated_at: str
    last_updated_relative: str


class KnowledgeSpaceListResponse(BaseModel):
    items: list[KnowledgeSpaceListItem]
    next_cursor: str | None


class KnowledgeSpaceDetailHeader(BaseModel):
    id: str
    name: str
    owner_team: str
    contact_name: str
    status: KnowledgeSpaceStatus
    visibility: str
    doc_count: int
    last_updated_at: datetime
    last_updated_relative: str


class KnowledgeSpaceTopicItem(BaseModel):
    id: str
    text: str


class KnowledgeSpaceRuleItem(BaseModel):
    id: str
    text: str


class KnowledgeSpaceLinkedDocumentItem(BaseModel):
    id: str
    target_type: KnowledgeSpaceLinkedDocumentTargetType
    target_id: str
    label: str
    hint: str


class KnowledgeSpaceDetailResponse(BaseModel):
    space: KnowledgeSpaceDetailHeader
    overview: str
    stewardship: str
    coverage_topics: list[KnowledgeSpaceTopicItem]
    operating_rules: list[KnowledgeSpaceRuleItem]
    linked_documents: list[KnowledgeSpaceLinkedDocumentItem]
