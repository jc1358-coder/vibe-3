from fastapi import APIRouter

router = APIRouter()


@router.get("/articles")
def get_articles() -> dict[str, list[object]]:
    return {"items": []}


@router.get("/collect-runs")
def get_collect_runs() -> dict[str, list[object]]:
    return {"items": []}
