from __future__ import annotations

from datetime import datetime
from typing import Generator, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, create_engine, func, inspect, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[Optional[str]] = mapped_column(String(320), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    album_state: Mapped["AlbumStateModel"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    normalized_album_states: Mapped[list["UserAlbumStateModel"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class AlbumStateModel(Base):
    __tablename__ = "album_states"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    state_json: Mapped[str] = mapped_column(Text)
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    user: Mapped[UserModel] = relationship(back_populates="album_state")


class AlbumModel(Base):
    __tablename__ = "albums"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    teams: Mapped[list["TeamModel"]] = relationship(back_populates="album", cascade="all, delete-orphan")
    stickers: Mapped[list["StickerModel"]] = relationship(back_populates="album", cascade="all, delete-orphan")
    user_states: Mapped[list["UserAlbumStateModel"]] = relationship(back_populates="album", cascade="all, delete-orphan")


class TeamModel(Base):
    __tablename__ = "teams"
    __table_args__ = (UniqueConstraint("album_id", "code", name="uq_teams_album_code"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    album_id: Mapped[int] = mapped_column(ForeignKey("albums.id"), index=True)
    code: Mapped[str] = mapped_column(String(16), index=True)
    name: Mapped[str] = mapped_column(String(160))
    group: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)
    group_position: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    flag_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    album: Mapped[AlbumModel] = relationship(back_populates="teams")


class StickerModel(Base):
    __tablename__ = "stickers"
    __table_args__ = (UniqueConstraint("album_id", "code", name="uq_stickers_album_code"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    album_id: Mapped[int] = mapped_column(ForeignKey("albums.id"), index=True)
    code: Mapped[str] = mapped_column(String(32), index=True)
    number: Mapped[int] = mapped_column(Integer, index=True)
    team_id: Mapped[Optional[int]] = mapped_column(ForeignKey("teams.id"), nullable=True, index=True)
    type: Mapped[str] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(255))
    is_special: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    is_shield: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    is_team_photo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    album: Mapped[AlbumModel] = relationship(back_populates="stickers")
    team: Mapped[Optional[TeamModel]] = relationship()


class UserAlbumStateModel(Base):
    __tablename__ = "user_album_states"
    __table_args__ = (UniqueConstraint("user_id", "album_id", name="uq_user_album_states_user_album"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    album_id: Mapped[int] = mapped_column(ForeignKey("albums.id"), index=True)
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    coca_cola_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    storage_version: Mapped[str] = mapped_column(String(40), nullable=False, default="normalized", server_default="normalized")
    migrated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    user: Mapped[UserModel] = relationship(back_populates="normalized_album_states")
    album: Mapped[AlbumModel] = relationship(back_populates="user_states")
    sticker_copies: Mapped[list["UserStickerCopyModel"]] = relationship(back_populates="user_album_state", cascade="all, delete-orphan")
    custom_cracks: Mapped[list["CustomCrackModel"]] = relationship(back_populates="user_album_state", cascade="all, delete-orphan")
    purchases: Mapped[list["PurchaseModel"]] = relationship(back_populates="user_album_state", cascade="all, delete-orphan")
    activity_log: Mapped[list["ActivityLogModel"]] = relationship(back_populates="user_album_state", cascade="all, delete-orphan")


class UserStickerCopyModel(Base):
    __tablename__ = "user_sticker_copies"
    __table_args__ = (UniqueConstraint("user_album_state_id", "sticker_id", name="uq_user_sticker_copies_state_sticker"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_album_state_id: Mapped[int] = mapped_column(ForeignKey("user_album_states.id"), index=True)
    sticker_id: Mapped[int] = mapped_column(ForeignKey("stickers.id"), index=True)
    copies: Mapped[int] = mapped_column(Integer, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    user_album_state: Mapped[UserAlbumStateModel] = relationship(back_populates="sticker_copies")
    sticker: Mapped[StickerModel] = relationship()


class CustomCrackModel(Base):
    __tablename__ = "custom_cracks"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    user_album_state_id: Mapped[int] = mapped_column(ForeignKey("user_album_states.id"), index=True)
    player: Mapped[str] = mapped_column(String(160))
    team_code: Mapped[str] = mapped_column(String(16))
    sticker_code: Mapped[str] = mapped_column(String(32), index=True)
    official: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    user_album_state: Mapped[UserAlbumStateModel] = relationship(back_populates="custom_cracks")


class PurchaseModel(Base):
    __tablename__ = "purchases"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    user_album_state_id: Mapped[int] = mapped_column(ForeignKey("user_album_states.id"), index=True)
    type: Mapped[str] = mapped_column(String(40))
    date: Mapped[str] = mapped_column(String(20))
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1)
    price: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    packs_per_box: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    stickers_per_pack: Mapped[float] = mapped_column(Float, nullable=False, default=7)
    notes: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(255), default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    user_album_state: Mapped[UserAlbumStateModel] = relationship(back_populates="purchases")


class ActivityLogModel(Base):
    __tablename__ = "activity_log"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    user_album_state_id: Mapped[int] = mapped_column(ForeignKey("user_album_states.id"), index=True)
    type: Mapped[str] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(Text)
    sticker_code: Mapped[str] = mapped_column(String(32), default="")
    created_at_value: Mapped[str] = mapped_column("created_at_value", String(80))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    user_album_state: Mapped[UserAlbumStateModel] = relationship(back_populates="activity_log")


engine = create_engine(
    get_settings().database_url,
    connect_args={"check_same_thread": False} if get_settings().database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    if not get_settings().auto_create_tables:
        return
    Base.metadata.create_all(bind=engine)
    _ensure_compat_columns()


def _ensure_compat_columns() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("users"):
        return
    statements = []
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "email" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN email VARCHAR(320)")
    if "password_hash" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")

    album_columns = {column["name"] for column in inspector.get_columns("album_states")} if inspector.has_table("album_states") else set()
    if "revision" not in album_columns:
        statements.append("ALTER TABLE album_states ADD COLUMN revision INTEGER NOT NULL DEFAULT 1")

    for table_name in ("activity_log", "custom_cracks", "purchases"):
        table_columns = {column["name"] for column in inspector.get_columns(table_name)} if inspector.has_table(table_name) else set()
        if table_columns and "sort_order" not in table_columns:
            statements.append(f"ALTER TABLE {table_name} ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0")

    if not statements:
        return
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def get_session() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session
