from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.preferences import UpdatePreferencesRequest
from app.services.preferences import update_preferences

router = APIRouter()


@router.patch("", status_code=status.HTTP_204_NO_CONTENT)
def patch_preferences(
    payload: UpdatePreferencesRequest, session: Session = Depends(get_db_session)
) -> Response:
    update_preferences(payload, session=session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)