from fastapi import APIRouter, HTTPException, Query, status

from app.db.sqlite import SCHEDULE_TYPES
from app.repositories.members import member_exists
from app.repositories.schedules import (
    create_schedule,
    delete_schedule,
    get_schedule,
    list_schedules,
    update_schedule,
)
from app.schemas.schedules import ScheduleCreate, ScheduleUpdate

router = APIRouter()


@router.get("")
def get_schedules(
    start: str | None = Query(default=None, alias="from"),
    end: str | None = Query(default=None, alias="to"),
    member_id: int | None = None,
    type: str | None = None,
) -> dict[str, list[dict[str, object]]]:
    if type and type not in SCHEDULE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="지원하지 않는 일정 유형입니다.")
    return {"items": list_schedules(start, end, member_id, type)}


@router.post("", status_code=status.HTTP_201_CREATED)
def post_schedule(payload: ScheduleCreate) -> dict[str, object]:
    ensure_member(payload.member_id)
    return create_schedule(payload)


@router.get("/{schedule_id}")
def get_schedule_detail(schedule_id: int) -> dict[str, object]:
    schedule = get_schedule(schedule_id)
    if schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="일정을 찾을 수 없습니다.")
    return schedule


@router.put("/{schedule_id}")
def put_schedule(schedule_id: int, payload: ScheduleUpdate) -> dict[str, object]:
    ensure_member(payload.member_id)
    schedule = update_schedule(schedule_id, payload)
    if schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="일정을 찾을 수 없습니다.")
    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_schedule(schedule_id: int) -> None:
    if not delete_schedule(schedule_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="일정을 찾을 수 없습니다.")


def ensure_member(member_id: int) -> None:
    if not member_exists(member_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="팀원을 찾을 수 없습니다.")