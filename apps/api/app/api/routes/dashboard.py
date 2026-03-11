from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard import build_dashboard_payload

router = APIRouter()


@router.get("", response_model=DashboardResponse)
def get_dashboard(session: Session = Depends(get_db_session)) -> DashboardResponse:
    return build_dashboard_payload(session=session)
