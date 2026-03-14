from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

ChatStatus = Literal["ready", "processing", "archived", "error"]


class ChatListQueryParams(BaseModel):
    limit: int = Field(default=20, ge=1, le=50)
    cursor: str | None = None
    status: ChatStatus | None = None


class ChatListItem(BaseModel):
    id: str
    title: str
    assistant_name: str
    last_message_preview: str | None
    last_message_at: datetime
    last_message_relative: str
    status: ChatStatus


class ChatListResponse(BaseModel):
    items: list[ChatListItem]
    next_cursor: str | None