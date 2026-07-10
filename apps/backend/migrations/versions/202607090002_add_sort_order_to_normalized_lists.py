"""ensure sort order on normalized list tables

Revision ID: 202607090002
Revises: 202607090001
Create Date: 2026-07-09 00:02:00
"""

from alembic import op
import sqlalchemy as sa

revision = "202607090002"
down_revision = "202607090001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for table_name in ("activity_log", "custom_cracks", "purchases"):
        if not inspector.has_table(table_name):
            continue
        columns = {column["name"] for column in inspector.get_columns(table_name)}
        if "sort_order" not in columns:
            op.add_column(table_name, sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for table_name in ("activity_log", "custom_cracks", "purchases"):
        if not inspector.has_table(table_name):
            continue
        columns = {column["name"] for column in inspector.get_columns(table_name)}
        if "sort_order" in columns:
            op.drop_column(table_name, "sort_order")
