from __future__ import annotations

from datetime import date, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query, status

from app.repositories.news import list_articles, list_collect_runs
from app.schemas.news import NewsCollectRequest
from app.services.news_collector import collect_news_for_date

router = APIRouter()
KST = timezone(timedelta(hours=9))


@router.get("/articles")
def get_articles(date: str | None = Query(default=None)) -> dict[str, list[dict[str, object]]]:
    return {"items": list_articles(date)}


@router.get("/collect-runs")
def get_collect_runs() -> dict[str, list[dict[str, object]]]:
    return {"items": list_collect_runs()}


@router.post("/collect", status_code=status.HTTP_201_CREATED)
def post_collect(payload: NewsCollectRequest) -> dict[str, object]:
    try:
        target_date = date.fromisoformat(payload.target_date)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="날짜 형식은 YYYY-MM-DD여야 합니다.") from exc
    return collect_news_for_date(target_date, "manual")
