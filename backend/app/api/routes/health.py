from fastapi import APIRouter

from app.db.sqlite import check_database

router = APIRouter()


@router.get("/health")
def get_api_health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/db")
def get_database_health() -> dict[str, str]:
    database_path = check_database()
    return {"status": "ok", "database_path": str(database_path)}
