from app.db.sqlite import get_connection
from app.schemas.schedules import ScheduleCreate, ScheduleUpdate


def list_schedules(
    start_date: str | None = None,
    end_date: str | None = None,
    member_id: int | None = None,
    schedule_type: str | None = None,
) -> list[dict[str, object]]:
    conditions: list[str] = []
    values: list[object] = []

    if start_date:
        conditions.append("date(s.end_at) >= date(?)")
        values.append(start_date)
    if end_date:
        conditions.append("date(s.start_at) <= date(?)")
        values.append(end_date)
    if member_id:
        conditions.append("s.member_id = ?")
        values.append(member_id)
    if schedule_type:
        conditions.append("s.schedule_type = ?")
        values.append(schedule_type)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with get_connection() as connection:
        rows = connection.execute(
            f"""
            SELECT
                s.id,
                s.member_id,
                m.name AS member_name,
                m.department,
                m.position,
                s.schedule_type,
                s.title,
                s.start_at,
                s.end_at,
                s.memo,
                s.created_at,
                s.updated_at
            FROM team_schedules s
            JOIN team_members m ON m.id = s.member_id
            {where_clause}
            ORDER BY s.start_at ASC, m.name ASC
            """,
            values,
        ).fetchall()
    return [dict(row) for row in rows]


def get_schedule(schedule_id: int) -> dict[str, object] | None:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT
                s.id,
                s.member_id,
                m.name AS member_name,
                m.department,
                m.position,
                s.schedule_type,
                s.title,
                s.start_at,
                s.end_at,
                s.memo,
                s.created_at,
                s.updated_at
            FROM team_schedules s
            JOIN team_members m ON m.id = s.member_id
            WHERE s.id = ?
            """,
            (schedule_id,),
        ).fetchone()
    return dict(row) if row else None


def create_schedule(payload: ScheduleCreate) -> dict[str, object]:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO team_schedules (member_id, schedule_type, title, start_at, end_at, memo)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload.member_id,
                payload.schedule_type,
                payload.title.strip(),
                payload.start_at,
                payload.end_at,
                payload.memo.strip() if payload.memo else None,
            ),
        )
        connection.commit()
        schedule_id = cursor.lastrowid
    schedule = get_schedule(schedule_id)
    if schedule is None:
        raise RuntimeError("일정 생성 후 조회에 실패했습니다.")
    return schedule


def update_schedule(schedule_id: int, payload: ScheduleUpdate) -> dict[str, object] | None:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE team_schedules
            SET member_id = ?, schedule_type = ?, title = ?, start_at = ?, end_at = ?, memo = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                payload.member_id,
                payload.schedule_type,
                payload.title.strip(),
                payload.start_at,
                payload.end_at,
                payload.memo.strip() if payload.memo else None,
                schedule_id,
            ),
        )
        connection.commit()
    if cursor.rowcount == 0:
        return None
    return get_schedule(schedule_id)


def delete_schedule(schedule_id: int) -> bool:
    with get_connection() as connection:
        cursor = connection.execute("DELETE FROM team_schedules WHERE id = ?", (schedule_id,))
        connection.commit()
    return cursor.rowcount > 0