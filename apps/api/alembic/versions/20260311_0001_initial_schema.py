from __future__ import annotations

from pathlib import Path

from alembic import context, op

revision = "20260311_0001"
down_revision = None
branch_labels = None
depends_on = None


def _schema_sql_path() -> Path:
    return Path(__file__).resolve().parents[4] / "db" / "schema.sql"


def _execute_sql(sql: str) -> None:
    bind = op.get_bind()
    raw_connection = bind.connection
    with raw_connection.cursor() as cursor:
        cursor.execute(sql)


def upgrade() -> None:
    if context.is_offline_mode():
        raise RuntimeError("Initial RockASK schema bootstrap requires online Alembic execution.")

    _execute_sql(_schema_sql_path().read_text(encoding="utf-8"))


def downgrade() -> None:
    if context.is_offline_mode():
        raise RuntimeError("Initial RockASK schema bootstrap requires online Alembic execution.")

    _execute_sql("DROP SCHEMA IF EXISTS rockask CASCADE;")
