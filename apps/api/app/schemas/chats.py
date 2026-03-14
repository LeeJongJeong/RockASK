from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

ChatStatus = Literal["ready", "processing", "archived", "error"]
ChatMessageRole = Literal["user", "assistant"]
ChatSourceType = Literal["document", "knowledge_space"]


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


class ChatDetailHeader(BaseModel):
    id: str
    title: str
    assistant_name: str
    status: ChatStatus
    created_at: datetime
    last_message_at: datetime
    last_message_relative: str


class ChatMessageItem(BaseModel):
    id: str
    role: ChatMessageRole
    content: str
    created_at: datetime
    note: str | None


class ChatSourceItem(BaseModel):
    id: str
    source_type: ChatSourceType
    target_id: str
    label: str
    hint: str


class ChatFollowUpItem(BaseModel):
    id: str
    text: str


class ChatDetailResponse(BaseModel):
    chat: ChatDetailHeader
    summary: str
    answer_snapshot: str
    messages: list[ChatMessageItem]
    sources: list[ChatSourceItem]
    follow_ups: list[ChatFollowUpItem]