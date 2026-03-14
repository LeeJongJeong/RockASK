from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

ThemePreference = Literal["system", "light", "dark"]


class UpdatePreferencesRequest(BaseModel):
    theme: ThemePreference | None = None
    last_scope_id: str | None = Field(default=None, max_length=120)

    @field_validator("last_scope_id", mode="before")
    @classmethod
    def normalize_last_scope_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @model_validator(mode="after")
    def validate_non_empty(self) -> "UpdatePreferencesRequest":
        if self.theme is None and self.last_scope_id is None:
            raise ValueError("At least one preference field must be provided.")
        return self