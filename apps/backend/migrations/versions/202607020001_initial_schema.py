"""initial schema

Revision ID: 202607020001
Revises:
Create Date: 2026-07-02 00:01:00
"""

from alembic import op
import sqlalchemy as sa

revision = "202607020001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_name"), "users", ["name"], unique=False)

    op.create_table(
        "album_states",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("state_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_album_states_user_id"), "album_states", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_album_states_user_id"), table_name="album_states")
    op.drop_table("album_states")
    op.drop_index(op.f("ix_users_name"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
