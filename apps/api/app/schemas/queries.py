import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

QuerySource = Literal["dashboard_header", "dashboard_hero", "dashboard_prompt"]


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


class CreateQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    scope_id: str = Field(min_length=1, max_length=120)
    source: QuerySource
    prompt_template_id: str | None = None

    @field_validator("query", mode="before")
    @classmethod
    def normalize_query(cls, value: str) -> str:
        return _normalize_text(value)

    @field_validator("scope_id", mode="before")
    @classmethod
    def normalize_scope_id(cls, value: str) -> str:
        return _normalize_text(value)

    @field_validator("prompt_template_id", mode="before")
    @classmethod
    def normalize_prompt_template_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = _normalize_text(value)
        return normalized or None


class CreateQueryResponse(BaseModel):
    query_id: str
    chat_id: str
    redirect_url: str