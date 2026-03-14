from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

PreferenceTheme = Literal["system", "light", "dark"]


class PreferencesUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    theme: PreferenceTheme | None = None
    last_scope_id: str | None = Field(default=None, max_length=255)

    @field_validator("last_scope_id")
    @classmethod
    def normalize_last_scope_id(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None

    @model_validator(mode="after")
    def validate_has_update_field(self) -> "PreferencesUpdateRequest":
        if self.theme is None and self.last_scope_id is None:
            raise ValueError("At least one preference field is required.")

        return self