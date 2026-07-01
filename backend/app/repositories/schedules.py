from app.db.sqlite import get_connection


def list_schedules() -> list[dict[str, object]]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, member_name, schedule_type, title, start_at, end_at, memo
            FROM team_schedules
            ORDER BY start_at ASC
            """
        ).fetchall()

    return [dict(row) for row in rows]
