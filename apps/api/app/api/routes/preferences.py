from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.preferences import PreferencesUpdateRequest
from app.services.preferences import update_preferences

router = APIRouter()


@router.patch("", status_code=status.HTTP_204_NO_CONTENT)
def patch_preferences(
    request: PreferencesUpdateRequest, session: Session = Depends(get_db_session)
) -> Response:
    update_preferences(request=request, session=session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)