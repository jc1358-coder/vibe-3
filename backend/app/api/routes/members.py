from fastapi import APIRouter, HTTPException, status

from app.repositories.members import create_member, delete_member, get_member, list_members, update_member
from app.schemas.members import MemberCreate, MemberUpdate

router = APIRouter()


@router.get("")
def get_members() -> dict[str, list[dict[str, object]]]:
    return {"items": list_members()}


@router.post("", status_code=status.HTTP_201_CREATED)
def post_member(payload: MemberCreate) -> dict[str, object]:
    return create_member(payload)


@router.get("/{member_id}")
def get_member_detail(member_id: int) -> dict[str, object]:
    member = get_member(member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="팀원을 찾을 수 없습니다.")
    return member


@router.put("/{member_id}")
def put_member(member_id: int, payload: MemberUpdate) -> dict[str, object]:
    member = update_member(member_id, payload)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="팀원을 찾을 수 없습니다.")
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(member_id: int) -> None:
    try:
        deleted = delete_member(member_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="팀원을 찾을 수 없습니다.")