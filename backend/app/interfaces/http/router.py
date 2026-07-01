from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.application.services import AlbumService, UserService
from app.domain.catalog import catalog
from app.infrastructure.database import get_session
from app.infrastructure.repositories import SqlAlchemyAlbumRepository, SqlAlchemyUserRepository
from app.interfaces.http.schemas import AlbumState, CocaColaPatch, CrackCreate, PurchaseCreate, UserCreate, UserOut

router = APIRouter(prefix="/api")


def user_service(session: Session = Depends(get_session)) -> UserService:
    return UserService(SqlAlchemyUserRepository(session))


def album_service(session: Session = Depends(get_session)) -> AlbumService:
    return AlbumService(SqlAlchemyUserRepository(session), SqlAlchemyAlbumRepository(session))


@router.post("/users", response_model=UserOut)
def create_or_get_user(payload: UserCreate, service: UserService = Depends(user_service)):
    try:
        return service.get_or_create_user(payload.name)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, service: UserService = Depends(user_service)):
    user = service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.get("/catalog")
def get_catalog():
    return catalog


@router.get("/catalog/summary")
def get_catalog_summary():
    return {
        "baseTotal": catalog["baseTotal"],
        "teams": len(catalog["teams"]),
        "stickers": len(catalog["stickers"]),
        "specials": len(catalog["specials"]),
        "cocaCola": len(catalog["addons"]["cocaCola"]["stickers"]),
    }


@router.get("/users/{user_id}/album")
def get_album(user_id: int, service: AlbumService = Depends(album_service)):
    return _album_call(lambda: service.get_album(user_id))


@router.put("/users/{user_id}/album")
def put_album(user_id: int, payload: AlbumState, service: AlbumService = Depends(album_service)):
    return _album_call(lambda: service.replace_album(user_id, payload.model_dump()))


@router.post("/users/{user_id}/album/stickers/{code}/increment")
def increment(user_id: int, code: str, service: AlbumService = Depends(album_service)):
    return _album_call(lambda: service.increment(user_id, code.upper()))


@router.post("/users/{user_id}/album/stickers/{code}/decrement")
def decrement(user_id: int, code: str, service: AlbumService = Depends(album_service)):
    return _album_call(lambda: service.decrement(user_id, code.upper()))


@router.patch("/users/{user_id}/album/coca-cola")
def patch_coca_cola(user_id: int, payload: CocaColaPatch, service: AlbumService = Depends(album_service)):
    return _album_call(lambda: service.set_coca_cola(user_id, payload.enabled))


@router.get("/users/{user_id}/album/stats")
def get_stats(user_id: int, service: AlbumService = Depends(album_service)):
    return _album_call(lambda: service.stats(user_id))


@router.post("/users/{user_id}/album/cracks")
def post_crack(user_id: int, payload: CrackCreate, service: AlbumService = Depends(album_service)):
    return _album_call(lambda: service.add_crack(user_id, payload.model_dump()))


@router.delete("/users/{user_id}/album/cracks/{crack_id}")
def delete_crack(user_id: int, crack_id: str, service: AlbumService = Depends(album_service)):
    return _album_call(lambda: service.delete_crack(user_id, crack_id))


@router.post("/users/{user_id}/album/purchases")
def post_purchase(user_id: int, payload: PurchaseCreate, service: AlbumService = Depends(album_service)):
    return _album_call(lambda: service.add_purchase(user_id, payload.model_dump()))


@router.delete("/users/{user_id}/album/purchases/{purchase_id}")
def delete_purchase(user_id: int, purchase_id: str, service: AlbumService = Depends(album_service)):
    return _album_call(lambda: service.delete_purchase(user_id, purchase_id))


@router.get("/users/{user_id}/album/export")
def export_album(user_id: int, service: AlbumService = Depends(album_service)):
    state = _album_call(lambda: service.export_album(user_id))
    exported_at = datetime.now(timezone.utc).isoformat()
    headers = {"Content-Disposition": f'attachment; filename="album-panini-{user_id}.json"'}
    return Response(
        content=AlbumState(**state).model_dump_json(indent=2),
        media_type="application/json",
        headers=headers | {"X-Exported-At": exported_at},
    )


@router.post("/users/{user_id}/album/import")
def import_album(user_id: int, payload: dict, service: AlbumService = Depends(album_service)):
    return _album_call(lambda: service.import_album(user_id, payload))


def _album_call(callback):
    try:
        return callback()
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
