from __future__ import annotations

from app.db.sqlite import get_connection

NEWS_SOURCE = "korea.kr"


def list_articles(collect_date: str | None = None) -> list[dict[str, object]]:
    conditions = ["source = ?"]
    values: list[object] = [NEWS_SOURCE]
    if collect_date:
        conditions.append("collected_date = ?")
        values.append(collect_date)

    where_clause = "WHERE " + " AND ".join(conditions)
    with get_connection() as connection:
        rows = connection.execute(
            f"""
            SELECT id, source, title, url, summary, published_at, collected_date, collected_at
            FROM news_articles
            {where_clause}
            ORDER BY published_at DESC, id DESC
            """,
            values,
        ).fetchall()
    return [dict(row) for row in rows]


def list_collect_runs() -> list[dict[str, object]]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, source, collect_date, mode, status, started_at, ended_at, error_message
            FROM news_collect_runs
            WHERE source = ?
            ORDER BY id DESC
            """,
            (NEWS_SOURCE,),
        ).fetchall()
    return [dict(row) for row in rows]


def run_exists(collect_date: str, mode: str) -> bool:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT 1
            FROM news_collect_runs
            WHERE source = ? AND collect_date = ? AND mode = ? AND status = 'completed'
            LIMIT 1
            """,
            (NEWS_SOURCE, collect_date, mode),
        ).fetchone()
    return row is not None


def create_collect_run(collect_date: str, mode: str, status: str = "running") -> int:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id
            FROM news_collect_runs
            WHERE source = ? AND collect_date = ? AND mode = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (NEWS_SOURCE, collect_date, mode),
        ).fetchone()
        if row is not None:
            run_id = int(row[0])
            connection.execute(
                """
                UPDATE news_collect_runs
                SET status = ?, started_at = CURRENT_TIMESTAMP, ended_at = NULL, error_message = NULL
                WHERE id = ?
                """,
                (status, run_id),
            )
            connection.commit()
            return run_id

        cursor = connection.execute(
            """
            INSERT INTO news_collect_runs (source, collect_date, mode, status)
            VALUES (?, ?, ?, ?)
            """,
            (NEWS_SOURCE, collect_date, mode, status),
        )
        connection.commit()
        return int(cursor.lastrowid)


def update_collect_run(run_id: int, status: str, error_message: str | None = None) -> None:
    with get_connection() as connection:
        connection.execute(
            """
            UPDATE news_collect_runs
            SET status = ?, ended_at = CURRENT_TIMESTAMP, error_message = ?
            WHERE id = ?
            """,
            (status, error_message, run_id),
        )
        connection.commit()


def upsert_article(payload: dict[str, object]) -> None:
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO news_articles (source, title, url, summary, published_at, collected_date)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(source, url) DO UPDATE SET
                title = excluded.title,
                summary = excluded.summary,
                published_at = excluded.published_at,
                collected_date = excluded.collected_date,
                collected_at = CURRENT_TIMESTAMP
            """,
            (
                payload["source"],
                payload["title"],
                payload["url"],
                payload.get("summary"),
                payload["published_at"],
                payload["collected_date"],
            ),
        )
        connection.commit()
