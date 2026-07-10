from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.application.security import TokenService
from app.application.services import AlbumService, UserService
from app.application.services import User
from app.domain.catalog import catalog
from app.infrastructure.security import JoseTokenService
from app.interfaces.http.dependencies import get_album_service, get_user_service
from app.config import get_settings
from app.interfaces.http.schemas import AlbumImportRequest, AlbumMigrationStatus, AlbumState, CocaColaPatch, CrackCreate, LoginRequest, PurchaseCreate, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/api")
bearer_scheme = HTTPBearer(auto_error=False)


def token_service() -> TokenService:
    return JoseTokenService()


def current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    service: UserService = Depends(get_user_service),
    tokens: TokenService = Depends(token_service),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    raw_token = request.cookies.get(get_settings().cookie_name) or (credentials.credentials if credentials else None)
    if not raw_token:
        raise credentials_error
    try:
        payload = tokens.decode_access_token(raw_token)
        user_id = int(payload.get("sub", ""))
    except (TypeError, ValueError):
        raise credentials_error from None
    user = service.get_user(user_id)
    if user is None:
        raise credentials_error
    return user


@router.post(
    "/auth/register",
    response_model=TokenResponse,
    tags=["auth"],
    status_code=status.HTTP_201_CREATED,
    responses={409: {"description": "Usuario/email ya registrado"}, 422: {"description": "Payload invalido"}},
)
def register(payload: RegisterRequest, response: Response, service: UserService = Depends(get_user_service)):
    try:
        session = service.register(str(payload.email), payload.name, payload.password)
        _set_auth_cookie(response, session["access_token"])
        return session
    except LookupError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    tags=["auth"],
    responses={401: {"description": "Credenciales invalidas"}, 422: {"description": "Payload invalido"}},
)
def login(payload: LoginRequest, response: Response, service: UserService = Depends(get_user_service)):
    try:
        session = service.login(str(payload.email), payload.password)
        _set_auth_cookie(response, session["access_token"])
        return session
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.post("/auth/logout", tags=["auth"], status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    _clear_auth_cookie(response)
    return None


@router.get("/auth/me", response_model=UserOut, tags=["auth"], responses={401: {"description": "Token ausente o invalido"}})
def get_me(user: User = Depends(current_user)):
    return user


@router.get("/catalog", tags=["catalog"])
def get_catalog():
    return catalog


@router.get("/catalog/summary", tags=["catalog"])
def get_catalog_summary():
    return {
        "baseTotal": catalog["baseTotal"],
        "teams": len(catalog["teams"]),
        "stickers": len(catalog["stickers"]),
        "specials": len(catalog["specials"]),
        "cocaCola": len(catalog["addons"]["cocaCola"]["stickers"]),
    }


@router.get("/me/album", tags=["album"], response_model=AlbumState, responses={401: {"description": "Token ausente o invalido"}})
def get_album(response: Response, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    record = _album_call(lambda: service.get_album_record(user.id))
    _set_album_headers(response, record.revision, record.updated_at, record.storage_version, record.migration_required)
    return record.state


@router.put("/me/album", tags=["album"], response_model=AlbumState, responses={401: {"description": "Token ausente o invalido"}})
def put_album(
    payload: AlbumState,
    response: Response,
    if_match: Optional[str] = Header(default=None, alias="If-Match"),
    user: User = Depends(current_user),
    service: AlbumService = Depends(get_album_service),
):
    expected_revision = _parse_if_match(if_match)
    try:
        state = service.replace_album(user.id, payload.model_dump(), expected_revision=expected_revision)
    except RuntimeError as exc:
        if str(exc) == "album_revision_conflict":
            raise HTTPException(status_code=409, detail="El album cambio en otra pestaña o dispositivo.") from exc
        raise
    record = _album_call(lambda: service.get_album_record(user.id))
    _set_album_headers(response, record.revision, record.updated_at, record.storage_version, record.migration_required)
    return state


@router.get("/me/album/migration-status", tags=["album"], response_model=AlbumMigrationStatus)
def get_album_migration_status(user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.migration_status(user.id))


@router.post("/me/album/migrate", tags=["album"], response_model=AlbumState)
def migrate_album(response: Response, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    record = _album_call(lambda: service.migrate_album(user.id))
    _set_album_headers(response, record.revision, record.updated_at, record.storage_version, record.migration_required)
    return record.state


@router.post("/me/album/stickers/{code}/increment", tags=["album"], response_model=AlbumState)
def increment(code: str, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.increment(user.id, code.upper()))


@router.post("/me/album/stickers/{code}/decrement", tags=["album"], response_model=AlbumState)
def decrement(code: str, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.decrement(user.id, code.upper()))


@router.patch("/me/album/coca-cola", tags=["album"], response_model=AlbumState)
def patch_coca_cola(payload: CocaColaPatch, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.set_coca_cola(user.id, payload.enabled))


@router.get("/me/album/stats", tags=["album"])
def get_stats(user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.stats(user.id))


@router.post("/me/album/cracks", tags=["album"], response_model=AlbumState)
def post_crack(payload: CrackCreate, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.add_crack(user.id, payload.model_dump()))


@router.delete("/me/album/cracks/{crack_id}", tags=["album"], response_model=AlbumState)
def delete_crack(crack_id: str, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.delete_crack(user.id, crack_id))


@router.post("/me/album/purchases", tags=["album"], response_model=AlbumState)
def post_purchase(payload: PurchaseCreate, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.add_purchase(user.id, payload.model_dump()))


@router.delete("/me/album/purchases/{purchase_id}", tags=["album"], response_model=AlbumState)
def delete_purchase(purchase_id: str, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.delete_purchase(user.id, purchase_id))


@router.get("/me/album/export", tags=["album"], responses={401: {"description": "Token ausente o invalido"}})
def export_album(user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    state = _album_call(lambda: service.export_album(user.id))
    exported_at = datetime.now(timezone.utc).isoformat()
    headers = {"Content-Disposition": f'attachment; filename="album-album-{user.id}.json"'}
    return Response(
        content=AlbumState(**state).model_dump_json(indent=2),
        media_type="application/json",
        headers=headers | {"X-Exported-At": exported_at},
    )


@router.post("/me/album/import", tags=["album"], response_model=AlbumState)
def import_album(payload: AlbumImportRequest, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    data = payload.model_dump(exclude_none=True)
    return _album_call(lambda: service.import_album(user.id, data.get("state", data)))


def _set_auth_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        settings.cookie_name,
        token,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=True,
        secure=settings.secure_cookies,
        samesite=settings.cookie_samesite,
    )


def _clear_auth_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(settings.cookie_name, httponly=True, secure=settings.secure_cookies, samesite=settings.cookie_samesite)


def _set_album_headers(response: Response, revision: int, updated_at: datetime, storage_version: str = "normalized", migration_required: bool = False) -> None:
    response.headers["ETag"] = f'"{revision}"'
    response.headers["X-Album-Revision"] = str(revision)
    response.headers["X-Album-Updated-At"] = updated_at.isoformat()
    response.headers["X-Album-Storage-Version"] = storage_version
    response.headers["X-Album-Migration-Required"] = "true" if migration_required else "false"


def _parse_if_match(value: Optional[str]) -> Optional[int]:
    if not value:
        return None
    try:
        return int(value.strip().strip('"'))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="If-Match invalido") from exc


def _album_call(callback):
    try:
        return callback()
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
