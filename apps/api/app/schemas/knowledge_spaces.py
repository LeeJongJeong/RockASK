from typing import Literal

from pydantic import BaseModel, Field, field_validator

KnowledgeSpaceStatus = Literal["active", "indexing", "error", "archived"]


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