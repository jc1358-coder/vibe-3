import sqlite3
from collections.abc import Iterator
from pathlib import Path

from app.core.config import DATA_DIR, DATABASE_PATH


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS team_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_name TEXT NOT NULL,
    schedule_type TEXT NOT NULL,
    title TEXT NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    memo TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    title TEXT NOT NULL,
    source TEXT,
    url TEXT UNIQUE,
    published_at TEXT,
    keyword TEXT,
    summary TEXT,
    collected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_collect_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    return connection


def connect() -> Iterator[sqlite3.Connection]:
    connection = get_connection()
    try:
        yield connection
    finally:
        connection.close()


def initialize_database() -> None:
    with get_connection() as connection:
        connection.executescript(SCHEMA_SQL)
        seed_schedule(connection)
        connection.commit()


def check_database() -> Path:
    initialize_database()
    with get_connection() as connection:
        connection.execute("SELECT 1").fetchone()
    return DATABASE_PATH


def seed_schedule(connection: sqlite3.Connection) -> None:
    exists = connection.execute("SELECT COUNT(*) FROM team_schedules").fetchone()[0]
    if exists:
        return

    connection.execute(
        """
        INSERT INTO team_schedules (member_name, schedule_type, title, start_at, end_at, memo)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            "행정1팀",
            "근무",
            "초기 스캐폴드 확인",
            "2026-07-01T09:00:00+09:00",
            "2026-07-01T18:00:00+09:00",
            "BE-DB 연동 확인용 샘플 데이터",
        ),
    )
