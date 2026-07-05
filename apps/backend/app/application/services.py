from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

from app.application.security import PasswordHasher, TokenService
from app.domain.album import (
    add_custom_crack,
    add_purchase,
    decrement_sticker,
    empty_state,
    get_album_stats,
    increment_sticker,
    remove_custom_crack,
    remove_purchase,
    sanitize_state,
)


@dataclass(frozen=True)
class User:
    id: int
    email: str | None
    name: str
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class UserAuthRecord:
    id: int
    email: str
    name: str
    password_hash: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class AlbumRecord:
    state: dict
    revision: int
    updated_at: datetime


class UserRepository(Protocol):
    def get(self, user_id: int) -> User | None: ...
    def get_auth_by_email(self, email: str) -> UserAuthRecord | None: ...
    def create(self, email: str, name: str, password_hash: str) -> User: ...


class AlbumRepository(Protocol):
    def get_by_user_id(self, user_id: int) -> AlbumRecord | None: ...
    def save_for_user_id(self, user_id: int, state: dict, expected_revision: int | None = None) -> AlbumRecord: ...


class UserService:
    def __init__(self, users: UserRepository, password_hasher: PasswordHasher, token_service: TokenService):
        self.users = users
        self.password_hasher = password_hasher
        self.token_service = token_service

    def get_user(self, user_id: int) -> User | None:
        return self.users.get(user_id)

    def register(self, email: str, name: str, password: str):
        normalized_email = email.strip().lower()
        normalized = " ".join(name.strip().split())
        if "@" not in normalized_email or "." not in normalized_email.rsplit("@", 1)[-1]:
            raise ValueError("Email invalido")
        if not normalized:
            raise ValueError("El nombre es obligatorio")
        if len(password) < 8:
            raise ValueError("La contrasena debe tener al menos 8 caracteres")
        if self.users.get_auth_by_email(normalized_email) is not None:
            raise LookupError("El email ya esta registrado")
        user = self.users.create(normalized_email, normalized, self.password_hasher.hash(password))
        return {"access_token": self.token_service.create_access_token(str(user.id)), "token_type": "bearer", "user": user}

    def login(self, email: str, password: str):
        auth_record = self.users.get_auth_by_email(email.strip().lower())
        if auth_record is None or not self.password_hasher.verify(password, auth_record.password_hash):
            raise PermissionError("Credenciales invalidas")
        user = self.users.get(auth_record.id)
        return {"access_token": self.token_service.create_access_token(str(user.id)), "token_type": "bearer", "user": user}


class AlbumService:
    def __init__(self, users: UserRepository, albums: AlbumRepository):
        self.users = users
        self.albums = albums

    def get_album_record(self, user_id: int) -> AlbumRecord:
        self._ensure_user(user_id)
        record = self.albums.get_by_user_id(user_id)
        if record is None:
            return self.albums.save_for_user_id(user_id, empty_state())
        return AlbumRecord(state=sanitize_state(record.state), revision=record.revision, updated_at=record.updated_at)

    def get_album(self, user_id: int) -> dict:
        return self.get_album_record(user_id).state

    def replace_album(self, user_id: int, state: dict, expected_revision: int | None = None) -> dict:
        self._ensure_user(user_id)
        return self.albums.save_for_user_id(user_id, sanitize_state(state), expected_revision=expected_revision).state

    def increment(self, user_id: int, code: str) -> dict:
        return self.replace_album(user_id, increment_sticker(self.get_album(user_id), code))

    def decrement(self, user_id: int, code: str) -> dict:
        return self.replace_album(user_id, decrement_sticker(self.get_album(user_id), code))

    def set_coca_cola(self, user_id: int, enabled: bool) -> dict:
        state = self.get_album(user_id)
        state["cocaColaEnabled"] = enabled
        return self.replace_album(user_id, state)

    def stats(self, user_id: int) -> dict:
        return get_album_stats(self.get_album(user_id))

    def add_crack(self, user_id: int, payload: dict) -> dict:
        return self.replace_album(user_id, add_custom_crack(self.get_album(user_id), payload))

    def delete_crack(self, user_id: int, crack_id: str) -> dict:
        return self.replace_album(user_id, remove_custom_crack(self.get_album(user_id), crack_id))

    def add_purchase(self, user_id: int, payload: dict) -> dict:
        return self.replace_album(user_id, add_purchase(self.get_album(user_id), payload))

    def delete_purchase(self, user_id: int, purchase_id: str) -> dict:
        return self.replace_album(user_id, remove_purchase(self.get_album(user_id), purchase_id))

    def import_album(self, user_id: int, payload: dict) -> dict:
        return self.replace_album(user_id, payload.get("state", payload))

    def export_album(self, user_id: int) -> dict:
        return self.get_album(user_id)

    def _ensure_user(self, user_id: int):
        user = self.users.get(user_id)
        if user is None:
            raise LookupError("Usuario no encontrado")
        return user
