from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.knowledge_spaces import (
    KnowledgeSpaceListQueryParams,
    KnowledgeSpaceListResponse,
    KnowledgeSpaceStatus,
)
from app.services.knowledge_spaces import list_knowledge_spaces_response

router = APIRouter()


@router.get("", response_model=KnowledgeSpaceListResponse)
def get_knowledge_spaces(
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = Query(default=None),
    status: KnowledgeSpaceStatus | None = Query(default=None),
    visibility: str | None = Query(default=None),
    session: Session = Depends(get_db_session),
) -> KnowledgeSpaceListResponse:
    params = KnowledgeSpaceListQueryParams(
        limit=limit,
        cursor=cursor,
        status=status,
        visibility=visibility,
    )
    return list_knowledge_spaces_response(params, session=session)