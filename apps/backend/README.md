# Album Backend

Backend FastAPI para guardar albumes por usuario usando SQLAlchemy, SQLite local en desarrollo, Postgres en produccion y autenticacion JWT.

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

- `ALBUM_ENV`: default `development`. En `production` exige un secreto JWT explicito.
- `ALBUM_DATABASE_URL`: default `sqlite:///./data/album.sqlite`. Para Postgres usa `postgresql+psycopg://user:password@host:5432/db`.
- `ALBUM_AUTO_CREATE_TABLES`: default `true` para desarrollo. En `production` debe ser `false` y se deben ejecutar migraciones Alembic.
- `ALBUM_JWT_SECRET_KEY`: secreto para firmar tokens; obligatorio en `production`.
- `ALBUM_JWT_ALGORITHM`: default `HS256`.
- `ALBUM_ACCESS_TOKEN_EXPIRE_MINUTES`: default `1440`.
- `ALBUM_CORS_ORIGINS`: obligatorio en produccion. Origenes permitidos separados por coma, por ejemplo `https://album.example.com,https://admin.example.com`.

Si `ALBUM_ENV=production`, la app falla al iniciar cuando `ALBUM_JWT_SECRET_KEY` conserva el valor default, `ALBUM_AUTO_CREATE_TABLES=true` o `ALBUM_CORS_ORIGINS` esta vacio.

## Migraciones

```bash
cd apps/backend
alembic upgrade head
```

Para crear una nueva migracion despues de cambiar modelos:

```bash
alembic revision --autogenerate -m "descripcion"
```

La URL de base se toma de `ALBUM_DATABASE_URL`.

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

El estado nuevo se guarda en tablas normalizadas por usuario y album. `album_states.state_json` se conserva como almacenamiento legacy/snapshot para migracion, exportacion compatible y rollback operativo.

Usuarios con estado legacy pueden consultar `GET /api/me/album/migration-status` y migrar con `POST /api/me/album/migrate`. La API publica del album sigue aceptando y devolviendo el mismo JSON `AlbumState`.

## Arquitectura

- `domain`: reglas puras del album, catalogo y estadisticas.
- `application`: servicios de usuario/album y puertos para hashing y tokens.
- `infrastructure`: SQLAlchemy, repositorios, `passlib` y `python-jose`.
- `interfaces/http`: FastAPI, schemas, rutas y dependencias que conectan puertos con implementaciones.

## Tests

```bash
python3 -m pytest
```

## Docker

La imagen del backend ejecuta `alembic upgrade head` desde `docker-entrypoint.sh` antes de iniciar Uvicorn. Si necesitas desactivarlo en un caso especial, usa `ALBUM_RUN_MIGRATIONS=false`.

```bash
docker build -t album-backend .
docker run --rm -p 8000:8000 \
  -e ALBUM_ENV=production \
  -e ALBUM_AUTO_CREATE_TABLES=false \
  -e ALBUM_DATABASE_URL=postgresql+psycopg://album:secret@db:5432/album \
  -e ALBUM_JWT_SECRET_KEY=replace-with-a-long-random-secret \
  -e ALBUM_CORS_ORIGINS=https://album.example.com \
  album-backend
```
