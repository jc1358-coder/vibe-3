import sqlite3

from app.db.sqlite import get_connection
from app.schemas.members import MemberCreate, MemberUpdate


def list_members() -> list[dict[str, object]]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, name, department, position, created_at, updated_at
            FROM team_members
            ORDER BY department ASC, name ASC
            """
        ).fetchall()
    return [dict(row) for row in rows]


def get_member(member_id: int) -> dict[str, object] | None:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, name, department, position, created_at, updated_at
            FROM team_members
            WHERE id = ?
            """,
            (member_id,),
        ).fetchone()
    return dict(row) if row else None


def create_member(payload: MemberCreate) -> dict[str, object]:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO team_members (name, department, position)
            VALUES (?, ?, ?)
            """,
            (payload.name.strip(), payload.department.strip(), payload.position.strip()),
        )
        connection.commit()
        member_id = cursor.lastrowid
    member = get_member(member_id)
    if member is None:
        raise RuntimeError("팀원 생성 후 조회에 실패했습니다.")
    return member


def update_member(member_id: int, payload: MemberUpdate) -> dict[str, object] | None:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE team_members
            SET name = ?, department = ?, position = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (payload.name.strip(), payload.department.strip(), payload.position.strip(), member_id),
        )
        connection.commit()
    if cursor.rowcount == 0:
        return None
    return get_member(member_id)


def delete_member(member_id: int) -> bool:
    with get_connection() as connection:
        try:
            cursor = connection.execute("DELETE FROM team_members WHERE id = ?", (member_id,))
            connection.commit()
        except sqlite3.IntegrityError as exc:
            raise ValueError("등록된 일정이 있는 팀원은 삭제할 수 없습니다.") from exc
    return cursor.rowcount > 0


def member_exists(member_id: int) -> bool:
    with get_connection() as connection:
        row = connection.execute("SELECT 1 FROM team_members WHERE id = ?", (member_id,)).fetchone()
    return row is not None