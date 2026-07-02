from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.services.news_collector import collect_news_for_date

KST = timezone(timedelta(hours=9))


def _previous_day_kst() -> date:
    return datetime.now(KST).date() - timedelta(days=1)


def _run_daily_collect() -> None:
    collect_news_for_date(_previous_day_kst(), "auto")


def create_news_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone=KST)
    scheduler.add_job(
        _run_daily_collect,
        trigger=CronTrigger(hour=9, minute=0, timezone=KST),
        id="korea_policy_news_daily_collect",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    return scheduler
