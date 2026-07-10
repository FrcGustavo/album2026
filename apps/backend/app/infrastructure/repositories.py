from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.application.services import AlbumRecord, User, UserAuthRecord
from app.domain.album import empty_state, sanitize_state
from app.domain.catalog import catalog
from app.infrastructure.database import (
    ActivityLogModel,
    AlbumModel,
    AlbumStateModel,
    CustomCrackModel,
    PurchaseModel,
    StickerModel,
    TeamModel,
    UserAlbumStateModel,
    UserModel,
    UserStickerCopyModel,
)


ACTIVE_ALBUM_CODE = "world-cup-2026-mx"
ACTIVE_ALBUM_NAME = "Álbum Mundial 2026 México"
NORMALIZED_STORAGE_VERSION = "normalized"
LEGACY_STORAGE_VERSION = "legacy"


def to_user(model: UserModel) -> User:
    return User(
        id=model.id,
        email=model.email,
        name=model.name,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def to_auth_record(model: UserModel) -> UserAuthRecord:
    return UserAuthRecord(
        id=model.id,
        email=model.email or "",
        name=model.name,
        password_hash=model.password_hash,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


class SqlAlchemyUserRepository:
    def __init__(self, session: Session):
        self.session = session

    def get(self, user_id: int) -> User | None:
        model = self.session.get(UserModel, user_id)
        return to_user(model) if model else None

    def get_auth_by_email(self, email: str) -> UserAuthRecord | None:
        model = self.session.scalar(select(UserModel).where(func.lower(UserModel.email) == email.lower()))
        return to_auth_record(model) if model else None

    def create(self, email: str, name: str, password_hash: str) -> User:
        model = UserModel(email=email, name=name, password_hash=password_hash)
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        return to_user(model)


class SqlAlchemyAlbumRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_user_id(self, user_id: int) -> AlbumRecord | None:
        album = self._ensure_catalog()
        normalized = self._get_normalized_state(user_id, album.id)
        if normalized is not None:
            return self._to_album_record(normalized)

        legacy = self._get_legacy_state(user_id)
        if legacy is None:
            return None
        return AlbumRecord(
            state=self._legacy_state_json(legacy),
            revision=legacy.revision,
            updated_at=legacy.updated_at,
            storage_version=LEGACY_STORAGE_VERSION,
            migration_required=True,
        )

    def save_for_user_id(self, user_id: int, state: dict, expected_revision: int | None = None) -> AlbumRecord:
        album = self._ensure_catalog()
        clean = sanitize_state(state)
        normalized = self._get_normalized_state(user_id, album.id)
        if normalized is None and self._get_legacy_state(user_id) is not None:
            return self._save_legacy_for_user_id(user_id, clean, expected_revision)
        if normalized is None:
            normalized = UserAlbumStateModel(
                user_id=user_id,
                album_id=album.id,
                revision=1,
                coca_cola_enabled=clean["cocaColaEnabled"],
                storage_version=NORMALIZED_STORAGE_VERSION,
                migrated_at=datetime.now(timezone.utc),
            )
            self.session.add(normalized)
            self.session.flush()
        else:
            if expected_revision is not None and normalized.revision != expected_revision:
                raise RuntimeError("album_revision_conflict")
            normalized.revision += 1
            normalized.coca_cola_enabled = clean["cocaColaEnabled"]

        self._replace_normalized_state(normalized, clean, album.id)
        self._write_legacy_snapshot(user_id, clean, normalized.revision)
        self.session.commit()
        self.session.refresh(normalized)
        return self._to_album_record(normalized)

    def get_migration_status(self, user_id: int) -> dict:
        album = self._ensure_catalog()
        normalized = self._get_normalized_state(user_id, album.id)
        legacy = self._get_legacy_state(user_id)
        return {
            "required": normalized is None and legacy is not None,
            "storageVersion": NORMALIZED_STORAGE_VERSION if normalized is not None else LEGACY_STORAGE_VERSION if legacy is not None else NORMALIZED_STORAGE_VERSION,
            "legacyRevision": legacy.revision if legacy is not None else None,
            "normalizedRevision": normalized.revision if normalized is not None else None,
        }

    def migrate_user(self, user_id: int) -> AlbumRecord:
        album = self._ensure_catalog()
        normalized = self._get_normalized_state(user_id, album.id)
        if normalized is not None:
            return self._to_album_record(normalized)

        legacy = self._get_legacy_state(user_id)
        clean = self._legacy_state_json(legacy) if legacy is not None else empty_state()
        revision = legacy.revision if legacy is not None else 1
        normalized = UserAlbumStateModel(
            user_id=user_id,
            album_id=album.id,
            revision=revision,
            coca_cola_enabled=clean["cocaColaEnabled"],
            storage_version=NORMALIZED_STORAGE_VERSION,
            migrated_at=datetime.now(timezone.utc),
        )
        self.session.add(normalized)
        self.session.flush()
        self._replace_normalized_state(normalized, clean, album.id)
        self._write_legacy_snapshot(user_id, clean, normalized.revision)
        self.session.commit()
        self.session.refresh(normalized)
        return self._to_album_record(normalized)

    def _save_legacy_for_user_id(self, user_id: int, clean: dict, expected_revision: int | None = None) -> AlbumRecord:
        model = self._get_legacy_state(user_id)
        if model is None:
            model = AlbumStateModel(user_id=user_id, state_json=json.dumps(clean))
            self.session.add(model)
        else:
            if expected_revision is not None and model.revision != expected_revision:
                raise RuntimeError("album_revision_conflict")
            model.state_json = json.dumps(clean)
            model.revision += 1
        self.session.commit()
        self.session.refresh(model)
        return AlbumRecord(
            state=clean,
            revision=model.revision,
            updated_at=model.updated_at,
            storage_version=LEGACY_STORAGE_VERSION,
            migration_required=True,
        )

    def _get_legacy_state(self, user_id: int) -> AlbumStateModel | None:
        return self.session.scalar(select(AlbumStateModel).where(AlbumStateModel.user_id == user_id))

    def _legacy_state_json(self, model: AlbumStateModel | None) -> dict:
        if model is None:
            return empty_state()
        try:
            state = sanitize_state(json.loads(model.state_json))
        except json.JSONDecodeError:
            state = empty_state()
        return state

    def _get_normalized_state(self, user_id: int, album_id: int) -> UserAlbumStateModel | None:
        return self.session.scalar(
            select(UserAlbumStateModel)
            .options(
                selectinload(UserAlbumStateModel.sticker_copies).selectinload(UserStickerCopyModel.sticker),
                selectinload(UserAlbumStateModel.custom_cracks),
                selectinload(UserAlbumStateModel.purchases),
                selectinload(UserAlbumStateModel.activity_log),
            )
            .where(UserAlbumStateModel.user_id == user_id, UserAlbumStateModel.album_id == album_id)
        )

    def _to_album_record(self, model: UserAlbumStateModel) -> AlbumRecord:
        state = empty_state()
        state["cocaColaEnabled"] = model.coca_cola_enabled
        for copy in model.sticker_copies:
            sticker = copy.sticker
            bucket = "cocaCola" if sticker.type == "coca-cola" else "specials" if sticker.is_special else "stickers"
            state[bucket][sticker.code] = copy.copies
        state["customCracks"] = [
            {
                "id": crack.id,
                "player": crack.player,
                "teamId": crack.team_code,
                "stickerCode": crack.sticker_code,
                "official": crack.official,
            }
            for crack in sorted(model.custom_cracks, key=lambda item: item.sort_order)
        ]
        state["purchases"] = [
            {
                "id": purchase.id,
                "type": purchase.type,
                "date": purchase.date,
                "quantity": purchase.quantity,
                "price": purchase.price,
                "packsPerBox": purchase.packs_per_box,
                "stickersPerPack": purchase.stickers_per_pack,
                "notes": purchase.notes,
                "source": purchase.source,
            }
            for purchase in sorted(model.purchases, key=lambda item: item.sort_order)
        ]
        state["activityLog"] = [
            {
                "id": entry.id,
                "type": entry.type,
                "message": entry.message,
                "stickerCode": entry.sticker_code,
                "createdAt": entry.created_at_value,
            }
            for entry in sorted(model.activity_log, key=lambda item: item.sort_order)
        ][:50]
        return AlbumRecord(
            state=sanitize_state(state),
            revision=model.revision,
            updated_at=model.updated_at,
            storage_version=NORMALIZED_STORAGE_VERSION,
            migration_required=False,
        )

    def _replace_normalized_state(self, model: UserAlbumStateModel, state: dict, album_id: int) -> None:
        self.session.query(UserStickerCopyModel).filter(UserStickerCopyModel.user_album_state_id == model.id).delete()
        self.session.query(CustomCrackModel).filter(CustomCrackModel.user_album_state_id == model.id).delete()
        self.session.query(PurchaseModel).filter(PurchaseModel.user_album_state_id == model.id).delete()
        self.session.query(ActivityLogModel).filter(ActivityLogModel.user_album_state_id == model.id).delete()
        self.session.flush()

        stickers = self._sticker_map(album_id)
        for bucket in ("stickers", "specials", "cocaCola"):
            for code, copies in state[bucket].items():
                sticker = stickers.get(code)
                if sticker is not None and copies > 0:
                    self.session.add(UserStickerCopyModel(user_album_state_id=model.id, sticker_id=sticker.id, copies=copies))

        for index, crack in enumerate(state["customCracks"]):
            self.session.add(
                CustomCrackModel(
                    id=crack["id"],
                    user_album_state_id=model.id,
                    player=crack["player"],
                    team_code=crack["teamId"],
                    sticker_code=crack["stickerCode"],
                    official=bool(crack.get("official", False)),
                    sort_order=index,
                )
            )

        for index, purchase in enumerate(state["purchases"]):
            self.session.add(
                PurchaseModel(
                    id=purchase["id"],
                    user_album_state_id=model.id,
                    type=purchase["type"],
                    date=purchase["date"],
                    quantity=purchase["quantity"],
                    price=purchase["price"],
                    packs_per_box=purchase["packsPerBox"],
                    stickers_per_pack=purchase["stickersPerPack"],
                    notes=purchase["notes"],
                    source=purchase["source"],
                    sort_order=index,
                )
            )

        for index, entry in enumerate(state["activityLog"][:50]):
            self.session.add(
                ActivityLogModel(
                    id=entry["id"],
                    user_album_state_id=model.id,
                    type=entry["type"],
                    message=entry["message"],
                    sticker_code=entry["stickerCode"],
                    created_at_value=entry["createdAt"],
                    sort_order=index,
                )
            )

    def _write_legacy_snapshot(self, user_id: int, state: dict, revision: int) -> None:
        snapshot = self._get_legacy_state(user_id)
        payload = json.dumps(sanitize_state(state))
        if snapshot is None:
            self.session.add(AlbumStateModel(user_id=user_id, state_json=payload, revision=revision))
            return
        snapshot.state_json = payload
        snapshot.revision = revision

    def _ensure_catalog(self) -> AlbumModel:
        album = self.session.scalar(select(AlbumModel).where(AlbumModel.code == ACTIVE_ALBUM_CODE))
        if album is None:
            album = AlbumModel(code=ACTIVE_ALBUM_CODE, name=ACTIVE_ALBUM_NAME, version=2)
            self.session.add(album)
            self.session.flush()

        teams_by_code = {team.code: team for team in self.session.scalars(select(TeamModel).where(TeamModel.album_id == album.id)).all()}
        for team in catalog["teams"]:
            if team["code"] in teams_by_code:
                continue
            model = TeamModel(
                album_id=album.id,
                code=team["code"],
                name=team["name"],
                group=team["group"],
                group_position=team["groupPosition"],
                flag_url=team["flagUrl"],
            )
            self.session.add(model)
            teams_by_code[team["code"]] = model
        self.session.flush()

        stickers_by_code = {sticker.code: sticker for sticker in self.session.scalars(select(StickerModel).where(StickerModel.album_id == album.id)).all()}
        for sticker in [*catalog["stickers"], *catalog["addons"]["cocaCola"]["stickers"]]:
            if sticker["code"] in stickers_by_code:
                continue
            self.session.add(
                StickerModel(
                    album_id=album.id,
                    code=sticker["code"],
                    number=sticker["number"],
                    team_id=teams_by_code[sticker["teamId"]].id if sticker.get("teamId") else None,
                    type=sticker["type"],
                    title=sticker["title"],
                    is_special=sticker["isSpecial"],
                    is_shield=sticker["isShield"],
                    is_team_photo=sticker["isTeamPhoto"],
                )
            )
        self.session.flush()
        return album

    def _sticker_map(self, album_id: int) -> dict[str, StickerModel]:
        return {sticker.code: sticker for sticker in self.session.scalars(select(StickerModel).where(StickerModel.album_id == album_id)).all()}
