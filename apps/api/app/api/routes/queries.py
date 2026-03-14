from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.queries import QueryCreateRequest, QueryCreateResponse
from app.services.queries import build_query_submission

router = APIRouter()


@router.post("", response_model=QueryCreateResponse, status_code=status.HTTP_201_CREATED)
def create_query(
    request: QueryCreateRequest, session: Session = Depends(get_db_session)
) -> QueryCreateResponse:
    return build_query_submission(request=request, session=session)