from fastapi import APIRouter

router = APIRouter()


@router.get("/jobs")
def get_excel_jobs() -> dict[str, list[object]]:
    return {"items": []}
