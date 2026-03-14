from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.chats import ChatDetailResponse, ChatListQueryParams, ChatListResponse, ChatStatus
from app.services.chats import get_chat_detail_response, list_chats_response

router = APIRouter()


@router.get("", response_model=ChatListResponse)
def get_chats(
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = Query(default=None),
    status: ChatStatus | None = Query(default=None),
    session: Session = Depends(get_db_session),
) -> ChatListResponse:
    params = ChatListQueryParams(limit=limit, cursor=cursor, status=status)
    return list_chats_response(params, session=session)


@router.get("/{chat_id}", response_model=ChatDetailResponse)
def get_chat_detail(
    chat_id: str = Path(min_length=1, max_length=120),
    session: Session = Depends(get_db_session),
) -> ChatDetailResponse:
    return get_chat_detail_response(chat_id, session=session)