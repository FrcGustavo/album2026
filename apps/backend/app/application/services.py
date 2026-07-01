from __future__ import annotations

from typing import Protocol

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


class UserRepository(Protocol):
    def get(self, user_id: int): ...
    def get_or_create_by_name(self, name: str): ...


class AlbumRepository(Protocol):
    def get_by_user_id(self, user_id: int) -> dict | None: ...
    def save_for_user_id(self, user_id: int, state: dict) -> dict: ...


class UserService:
    def __init__(self, users: UserRepository):
        self.users = users

    def get_user(self, user_id: int):
        return self.users.get(user_id)

    def get_or_create_user(self, name: str):
        normalized = " ".join(name.strip().split())
        if not normalized:
            raise ValueError("El nombre es obligatorio")
        return self.users.get_or_create_by_name(normalized)


class AlbumService:
    def __init__(self, users: UserRepository, albums: AlbumRepository):
        self.users = users
        self.albums = albums

    def get_album(self, user_id: int) -> dict:
        self._ensure_user(user_id)
        state = self.albums.get_by_user_id(user_id)
        if state is None:
            return self.albums.save_for_user_id(user_id, empty_state())
        return sanitize_state(state)

    def replace_album(self, user_id: int, state: dict) -> dict:
        self._ensure_user(user_id)
        return self.albums.save_for_user_id(user_id, sanitize_state(state))

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
