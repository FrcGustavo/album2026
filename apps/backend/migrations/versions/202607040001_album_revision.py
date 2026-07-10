"""add album revision

Revision ID: 202607040001
Revises: 202607020001
Create Date: 2026-07-04 00:01:00
"""

from alembic import op
import sqlalchemy as sa

revision = "202607040001"
down_revision = "202607020001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("album_states", sa.Column("revision", sa.Integer(), nullable=False, server_default="1"))


def downgrade() -> None:
    op.drop_column("album_states", "revision")
