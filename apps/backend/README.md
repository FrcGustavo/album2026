# Panini Backend

Backend FastAPI para guardar albumes por usuario usando SQLite local y autenticacion JWT.

## Desarrollo

```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

La API vive en `http://127.0.0.1:8000/api`.
Swagger vive en `http://127.0.0.1:8000/docs`.

## Configuracion

Variables disponibles:

- `PANINI_ENV`: default `development`. En `production` exige un secreto JWT explicito.
- `PANINI_DATABASE_URL`: default `sqlite:///./data/panini.sqlite`.
- `PANINI_JWT_SECRET_KEY`: secreto para firmar tokens; obligatorio en `production`.
- `PANINI_JWT_ALGORITHM`: default `HS256`.
- `PANINI_ACCESS_TOKEN_EXPIRE_MINUTES`: default `1440`.

Si `PANINI_ENV=production` y `PANINI_JWT_SECRET_KEY` conserva el valor default, la app falla al iniciar.

## Autenticacion

Endpoints publicos:

- `POST /api/auth/register`: crea cuenta y devuelve JWT.
- `POST /api/auth/login`: valida credenciales y devuelve JWT.

Endpoint de sesion:

- `GET /api/auth/me`: devuelve el usuario autenticado.

Usa el token como header:

```http
Authorization: Bearer <access_token>
```

## Album

Los endpoints del album usan siempre el usuario autenticado:

- `GET /api/me/album`
- `PUT /api/me/album`
- `POST /api/me/album/stickers/{code}/increment`
- `POST /api/me/album/stickers/{code}/decrement`
- `PATCH /api/me/album/coca-cola`
- `GET /api/me/album/stats`
- `POST /api/me/album/cracks`
- `DELETE /api/me/album/cracks/{crack_id}`
- `POST /api/me/album/purchases`
- `DELETE /api/me/album/purchases/{purchase_id}`
- `GET /api/me/album/export`
- `POST /api/me/album/import`

El estado se guarda en `album_states.state_json` para conservar una persistencia simple y versionable.

## Arquitectura

- `domain`: reglas puras del album, catalogo y estadisticas.
- `application`: servicios de usuario/album y puertos para hashing y tokens.
- `infrastructure`: SQLAlchemy, SQLite, repositorios, `passlib` y `python-jose`.
- `interfaces/http`: FastAPI, schemas, rutas y dependencias que conectan puertos con implementaciones.

## Tests

```bash
python3 -m pytest
```
