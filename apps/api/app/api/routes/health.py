from fastapi import APIRouter

from app.db.session import is_database_available

router = APIRouter()


@router.get("")
def health_check() -> dict[str, str]:
    database = "ok" if is_database_available() else "unavailable"
    status = "ok" if database == "ok" else "degraded"
    return {"status": status, "service": "rockask-api", "database": database}
