from fastapi import APIRouter

from app.repositories.schedules import list_schedules

router = APIRouter()


@router.get("")
def get_schedules() -> dict[str, object]:
    return {"items": list_schedules()}
