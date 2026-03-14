from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.documents import DocumentDetailResponse
from app.services.documents import get_document_detail_response

router = APIRouter()


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_detail(
    document_id: str = Path(min_length=1, max_length=120),
    session: Session = Depends(get_db_session),
) -> DocumentDetailResponse:
    return get_document_detail_response(document_id, session=session)