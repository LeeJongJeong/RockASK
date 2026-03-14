from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

QuerySource = Literal["dashboard_header", "dashboard_hero", "dashboard_prompt"]


class QueryCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(min_length=1, max_length=500)
    scope_id: str = Field(min_length=1, max_length=255)
    source: QuerySource
    prompt_template_id: str | None = Field(default=None, max_length=255)

    @field_validator("query")
    @classmethod
    def normalize_query(cls, value: str) -> str:
        normalized = " ".join(value.split())

        if not normalized:
            raise ValueError("query must not be blank")

        return normalized

    @field_validator("scope_id")
    @classmethod
    def validate_scope_id(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("scope_id must not be blank")

        return value.strip()

    @field_validator("prompt_template_id")
    @classmethod
    def normalize_prompt_template_id(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None


class QueryCreateResponse(BaseModel):
    query_id: str
    chat_id: str
    redirect_url: str