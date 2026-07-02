from __future__ import annotations

from datetime import datetime
from typing import Generator, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, create_engine, func, inspect, text
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


class AlbumStateModel(Base):
    __tablename__ = "album_states"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    state_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    user: Mapped[UserModel] = relationship(back_populates="album_state")


engine = create_engine(
    get_settings().database_url,
    connect_args={"check_same_thread": False} if get_settings().database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    if not get_settings().auto_create_tables:
        return
    Base.metadata.create_all(bind=engine)
    _ensure_auth_columns()


def _ensure_auth_columns() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("users"):
        return
    columns = {column["name"] for column in inspector.get_columns("users")}
    statements = []
    if "email" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN email VARCHAR(320)")
    if "password_hash" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")
    if not statements:
        return
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def get_session() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session
