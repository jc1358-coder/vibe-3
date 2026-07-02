from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from pathlib import Path

from app.core.config import DATA_DIR, DATABASE_PATH


SCHEDULE_TYPES = {"휴가", "근무", "출장", "교육", "기타"}

BASE_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    schedule_type TEXT NOT NULL,
    title TEXT NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    memo TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES team_members(id)
);

CREATE TABLE IF NOT EXISTS excel_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL,
    input_file_path TEXT,
    output_file_path TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manual_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    indexed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaint_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_text TEXT NOT NULL,
    answer_draft TEXT,
    evidence_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    summary TEXT,
    published_at TEXT NOT NULL,
    collected_date TEXT NOT NULL,
    collected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_collect_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    collect_date TEXT NOT NULL,
    mode TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT,
    error_message TEXT
);
"""


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def connect() -> Iterator[sqlite3.Connection]:
    connection = get_connection()
    try:
        yield connection
    finally:
        connection.close()


def initialize_database() -> None:
    with get_connection() as connection:
        migrate_legacy_schedule_table(connection)
        connection.executescript(BASE_SCHEMA_SQL)
        migrate_news_schema(connection)
        seed_initial_data(connection)
        connection.commit()


def migrate_legacy_schedule_table(connection: sqlite3.Connection) -> None:
    row = connection.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'team_schedules'"
    ).fetchone()
    if row is None:
        return

    columns = {
        column[1]
        for column in connection.execute("PRAGMA table_info(team_schedules)").fetchall()
    }
    if "member_id" in columns:
        return

    connection.execute("ALTER TABLE team_schedules RENAME TO team_schedules_legacy")


def migrate_news_schema(connection: sqlite3.Connection) -> None:
    news_columns = {
        column[1]
        for column in connection.execute("PRAGMA table_info(news_articles)").fetchall()
    }
    if news_columns:
        if "source" not in news_columns:
            connection.execute("ALTER TABLE news_articles ADD COLUMN source TEXT")
        if "published_at" not in news_columns:
            connection.execute("ALTER TABLE news_articles ADD COLUMN published_at TEXT")
        if "collected_date" not in news_columns:
            connection.execute("ALTER TABLE news_articles ADD COLUMN collected_date TEXT")
        if "collected_at" not in news_columns:
            connection.execute("ALTER TABLE news_articles ADD COLUMN collected_at TEXT")
        connection.execute(
            "UPDATE news_articles SET source = COALESCE(source, 'korea.kr'), collected_date = COALESCE(collected_date, date(collected_at)), published_at = COALESCE(published_at, collected_date)"
        )

    run_columns = {
        column[1]
        for column in connection.execute("PRAGMA table_info(news_collect_runs)").fetchall()
    }
    if run_columns:
        if "source" not in run_columns:
            connection.execute("ALTER TABLE news_collect_runs ADD COLUMN source TEXT")
        if "collect_date" not in run_columns:
            connection.execute("ALTER TABLE news_collect_runs ADD COLUMN collect_date TEXT")
        if "mode" not in run_columns:
            connection.execute("ALTER TABLE news_collect_runs ADD COLUMN mode TEXT")
        connection.execute(
            "UPDATE news_collect_runs SET source = COALESCE(source, 'korea.kr'), collect_date = COALESCE(collect_date, date(started_at)), mode = COALESCE(mode, 'manual')"
        )

    connection.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_source_url ON news_articles(source, url)"
    )
    connection.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_news_collect_runs_source_date_mode ON news_collect_runs(source, collect_date, mode)"
    )


def check_database() -> Path:
    initialize_database()
    with get_connection() as connection:
        connection.execute("SELECT 1").fetchone()
    return DATABASE_PATH


def seed_initial_data(connection: sqlite3.Connection) -> None:
    member_count = connection.execute("SELECT COUNT(*) FROM team_members").fetchone()[0]
    if member_count == 0:
        cursor = connection.execute(
            """
            INSERT INTO team_members (name, department, position)
            VALUES (?, ?, ?)
            """,
            ("김행정", "행정1팀", "주무관"),
        )
        member_id = cursor.lastrowid
    else:
        member_id = connection.execute(
            "SELECT id FROM team_members ORDER BY id ASC LIMIT 1"
        ).fetchone()[0]

    schedule_count = connection.execute("SELECT COUNT(*) FROM team_schedules").fetchone()[0]
    if schedule_count > 0:
        return

    connection.execute(
        """
        INSERT INTO team_schedules (member_id, schedule_type, title, start_at, end_at, memo)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            member_id,
            "근무",
            "초기 스캐폴드 확인",
            "2026-07-01T09:00",
            "2026-07-01T18:00",
            "BE-DB 연동 확인용 샘플 데이터",
        ),
    )
