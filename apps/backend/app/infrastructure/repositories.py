from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.album import empty_state, sanitize_state
from app.infrastructure.database import AlbumStateModel, UserModel


@dataclass(frozen=True)
class User:
    id: int
    name: str
    created_at: datetime
    updated_at: datetime


def to_user(model: UserModel) -> User:
    return User(id=model.id, name=model.name, created_at=model.created_at, updated_at=model.updated_at)


class SqlAlchemyUserRepository:
    def __init__(self, session: Session):
        self.session = session

    def get(self, user_id: int) -> User | None:
        model = self.session.get(UserModel, user_id)
        return to_user(model) if model else None

    def get_or_create_by_name(self, name: str) -> User:
        model = self.session.scalar(select(UserModel).where(func.lower(UserModel.name) == name.lower()))
        if model is None:
            model = UserModel(name=name)
            self.session.add(model)
            self.session.commit()
            self.session.refresh(model)
        return to_user(model)


class SqlAlchemyAlbumRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_user_id(self, user_id: int) -> dict | None:
        model = self.session.scalar(select(AlbumStateModel).where(AlbumStateModel.user_id == user_id))
        if model is None:
            return None
        try:
            return sanitize_state(json.loads(model.state_json))
        except json.JSONDecodeError:
            return empty_state()

    def save_for_user_id(self, user_id: int, state: dict) -> dict:
        clean = sanitize_state(state)
        model = self.session.scalar(select(AlbumStateModel).where(AlbumStateModel.user_id == user_id))
        if model is None:
            model = AlbumStateModel(user_id=user_id, state_json=json.dumps(clean))
            self.session.add(model)
        else:
            model.state_json = json.dumps(clean)
        self.session.commit()
        return clean
