from datetime import datetime
from typing import Literal

from pydantic import BaseModel

DocumentStatus = Literal["draft", "indexing", "approved", "archived", "error"]
DocumentRelatedTargetType = Literal["knowledge_space", "chat", "document"]


class DocumentDetailHeader(BaseModel):
    id: str
    title: str
    owner_team: str
    visibility: str
    status: DocumentStatus
    updated_at: datetime
    updated_relative: str
    summary: str


class DocumentHighlightItem(BaseModel):
    id: str
    text: str


class DocumentRecommendedQuestionItem(BaseModel):
    id: str
    text: str


class DocumentRelatedLinkItem(BaseModel):
    id: str
    target_type: DocumentRelatedTargetType
    target_id: str
    label: str
    hint: str


class DocumentDetailResponse(BaseModel):
    document: DocumentDetailHeader
    overview: str
    highlights: list[DocumentHighlightItem]
    recommended_questions: list[DocumentRecommendedQuestionItem]
    related_links: list[DocumentRelatedLinkItem]