from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.knowledge_spaces import (
    KnowledgeSpaceDetailResponse,
    KnowledgeSpaceListQueryParams,
    KnowledgeSpaceListResponse,
    KnowledgeSpaceStatus,
)
from app.services.knowledge_spaces import (
    get_knowledge_space_detail_response,
    list_knowledge_spaces_response,
)

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


@router.get("/{knowledge_space_id}", response_model=KnowledgeSpaceDetailResponse)
def get_knowledge_space_detail(
    knowledge_space_id: str = Path(min_length=1, max_length=120),
    session: Session = Depends(get_db_session),
) -> KnowledgeSpaceDetailResponse:
    return get_knowledge_space_detail_response(knowledge_space_id, session=session)
