from fastapi import APIRouter

router = APIRouter()


@router.get("/manuals")
def get_manuals() -> dict[str, list[object]]:
    return {"items": []}
