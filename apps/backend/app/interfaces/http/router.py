from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.application.security import TokenService
from app.application.services import AlbumService, UserService
from app.application.services import User
from app.domain.catalog import catalog
from app.infrastructure.security import JoseTokenService
from app.interfaces.http.dependencies import get_album_service, get_user_service
from app.interfaces.http.schemas import AlbumState, CocaColaPatch, CrackCreate, LoginRequest, PurchaseCreate, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/api")
bearer_scheme = HTTPBearer()


def token_service() -> TokenService:
    return JoseTokenService()


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    service: UserService = Depends(get_user_service),
    tokens: TokenService = Depends(token_service),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = tokens.decode_access_token(credentials.credentials)
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
def register(payload: RegisterRequest, service: UserService = Depends(get_user_service)):
    try:
        return service.register(payload.email, payload.name, payload.password)
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
def login(payload: LoginRequest, service: UserService = Depends(get_user_service)):
    try:
        return service.login(payload.email, payload.password)
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


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
def get_album(user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.get_album(user.id))


@router.put("/me/album", tags=["album"], response_model=AlbumState, responses={401: {"description": "Token ausente o invalido"}})
def put_album(payload: AlbumState, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.replace_album(user.id, payload.model_dump()))


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
    headers = {"Content-Disposition": f'attachment; filename="album-panini-{user.id}.json"'}
    return Response(
        content=AlbumState(**state).model_dump_json(indent=2),
        media_type="application/json",
        headers=headers | {"X-Exported-At": exported_at},
    )


@router.post("/me/album/import", tags=["album"], response_model=AlbumState)
def import_album(payload: dict, user: User = Depends(current_user), service: AlbumService = Depends(get_album_service)):
    return _album_call(lambda: service.import_album(user.id, payload))


def _album_call(callback):
    try:
        return callback()
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
