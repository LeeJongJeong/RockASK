from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.queries import CreateQueryRequest, CreateQueryResponse
from app.services.queries import create_query_response

router = APIRouter()


@router.post("", response_model=CreateQueryResponse, status_code=status.HTTP_201_CREATED)
def create_query(payload: CreateQueryRequest, session: Session = Depends(get_db_session)) -> CreateQueryResponse:
    return create_query_response(payload, session=session)