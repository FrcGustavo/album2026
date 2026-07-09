"""add normalized album storage

Revision ID: 202607090001
Revises: 202607040001
Create Date: 2026-07-09 00:01:00
"""

from alembic import op
import sqlalchemy as sa

revision = "202607090001"
down_revision = "202607040001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "albums",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_albums_code"), "albums", ["code"], unique=True)

    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("album_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=16), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("group", sa.String(length=8), nullable=True),
        sa.Column("group_position", sa.Integer(), nullable=True),
        sa.Column("flag_url", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["album_id"], ["albums.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("album_id", "code", name="uq_teams_album_code"),
    )
    op.create_index(op.f("ix_teams_album_id"), "teams", ["album_id"], unique=False)
    op.create_index(op.f("ix_teams_code"), "teams", ["code"], unique=False)

    op.create_table(
        "stickers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("album_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=True),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("is_special", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("is_shield", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("is_team_photo", sa.Boolean(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["album_id"], ["albums.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("album_id", "code", name="uq_stickers_album_code"),
    )
    op.create_index(op.f("ix_stickers_album_id"), "stickers", ["album_id"], unique=False)
    op.create_index(op.f("ix_stickers_code"), "stickers", ["code"], unique=False)
    op.create_index(op.f("ix_stickers_number"), "stickers", ["number"], unique=False)
    op.create_index(op.f("ix_stickers_team_id"), "stickers", ["team_id"], unique=False)

    op.create_table(
        "user_album_states",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("album_id", sa.Integer(), nullable=False),
        sa.Column("revision", sa.Integer(), server_default="1", nullable=False),
        sa.Column("coca_cola_enabled", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("storage_version", sa.String(length=40), server_default="normalized", nullable=False),
        sa.Column("migrated_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["album_id"], ["albums.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "album_id", name="uq_user_album_states_user_album"),
    )
    op.create_index(op.f("ix_user_album_states_album_id"), "user_album_states", ["album_id"], unique=False)
    op.create_index(op.f("ix_user_album_states_user_id"), "user_album_states", ["user_id"], unique=False)

    op.create_table(
        "activity_log",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("user_album_state_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("sticker_code", sa.String(length=32), nullable=False),
        sa.Column("created_at_value", sa.String(length=80), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_album_state_id"], ["user_album_states.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_activity_log_user_album_state_id"), "activity_log", ["user_album_state_id"], unique=False)

    op.create_table(
        "custom_cracks",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("user_album_state_id", sa.Integer(), nullable=False),
        sa.Column("player", sa.String(length=160), nullable=False),
        sa.Column("team_code", sa.String(length=16), nullable=False),
        sa.Column("sticker_code", sa.String(length=32), nullable=False),
        sa.Column("official", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_album_state_id"], ["user_album_states.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_custom_cracks_sticker_code"), "custom_cracks", ["sticker_code"], unique=False)
    op.create_index(op.f("ix_custom_cracks_user_album_state_id"), "custom_cracks", ["user_album_state_id"], unique=False)

    op.create_table(
        "purchases",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("user_album_state_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("date", sa.String(length=20), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("packs_per_box", sa.Float(), nullable=False),
        sa.Column("stickers_per_pack", sa.Float(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("source", sa.String(length=255), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_album_state_id"], ["user_album_states.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_purchases_user_album_state_id"), "purchases", ["user_album_state_id"], unique=False)

    op.create_table(
        "user_sticker_copies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_album_state_id", sa.Integer(), nullable=False),
        sa.Column("sticker_id", sa.Integer(), nullable=False),
        sa.Column("copies", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["sticker_id"], ["stickers.id"]),
        sa.ForeignKeyConstraint(["user_album_state_id"], ["user_album_states.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_album_state_id", "sticker_id", name="uq_user_sticker_copies_state_sticker"),
    )
    op.create_index(op.f("ix_user_sticker_copies_sticker_id"), "user_sticker_copies", ["sticker_id"], unique=False)
    op.create_index(op.f("ix_user_sticker_copies_user_album_state_id"), "user_sticker_copies", ["user_album_state_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_sticker_copies_user_album_state_id"), table_name="user_sticker_copies")
    op.drop_index(op.f("ix_user_sticker_copies_sticker_id"), table_name="user_sticker_copies")
    op.drop_table("user_sticker_copies")
    op.drop_index(op.f("ix_purchases_user_album_state_id"), table_name="purchases")
    op.drop_table("purchases")
    op.drop_index(op.f("ix_custom_cracks_user_album_state_id"), table_name="custom_cracks")
    op.drop_index(op.f("ix_custom_cracks_sticker_code"), table_name="custom_cracks")
    op.drop_table("custom_cracks")
    op.drop_index(op.f("ix_activity_log_user_album_state_id"), table_name="activity_log")
    op.drop_table("activity_log")
    op.drop_index(op.f("ix_user_album_states_user_id"), table_name="user_album_states")
    op.drop_index(op.f("ix_user_album_states_album_id"), table_name="user_album_states")
    op.drop_table("user_album_states")
    op.drop_index(op.f("ix_stickers_team_id"), table_name="stickers")
    op.drop_index(op.f("ix_stickers_number"), table_name="stickers")
    op.drop_index(op.f("ix_stickers_code"), table_name="stickers")
    op.drop_index(op.f("ix_stickers_album_id"), table_name="stickers")
    op.drop_table("stickers")
    op.drop_index(op.f("ix_teams_code"), table_name="teams")
    op.drop_index(op.f("ix_teams_album_id"), table_name="teams")
    op.drop_table("teams")
    op.drop_index(op.f("ix_albums_code"), table_name="albums")
    op.drop_table("albums")
