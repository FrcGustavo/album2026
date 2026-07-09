# Documentacion tecnica

Esta pagina concentra los detalles tecnicos del proyecto. El README principal esta pensado para usuarios que solo quieren entender y ejecutar la app.

## Stack

- Frontend: React + Vite.
- Backend: FastAPI + SQLAlchemy.
- Base de datos: SQLite en desarrollo local simple, Postgres en produccion/Docker.
- Migraciones: Alembic.
- Autenticacion: JWT.
- Contenedores: Docker Compose con frontend, backend y Postgres.

## Investigacion base

- La Copa Mundial 2026 se juega en Canada, Mexico y Estados Unidos, con 48 equipos, 16 ciudades sede, 104 partidos y formato de 12 grupos de 4.
- La edicion 2026 fue reportada por medios como la mas grande hasta ahora: 980 stickers, album de 112 paginas, sobres de 7 stickers y 68 stickers especiales.
- La cobertura consultada menciona una doble pagina de 12 stickers Coca-Cola disponibles por promocion.
- No encontre un checklist oficial completo y publico de la edicion Mexico con numeracion, nombres y orden exacto. Por eso el catalogo incluido es una estructura versionable de 980 espacios: 36 apertura/sedes, 864 equipos, 68 estrellas y 12 Coca-Cola.

## Scripts principales

Desde la raiz del repo:

```bash
pnpm dev          # frontend
pnpm dev:api      # backend en 127.0.0.1:8000
pnpm dev:all      # frontend y backend juntos
pnpm build        # build del frontend
pnpm test:api     # tests del backend
pnpm test:frontend
pnpm lint
```

## Variables del backend

- `ALBUM_ENV`: default `development`. En `production` exige un secreto JWT explicito.
- `ALBUM_DATABASE_URL`: default `sqlite:///./data/album.sqlite`. En produccion usa Postgres, por ejemplo `postgresql+psycopg://user:password@host:5432/db`.
- `ALBUM_AUTO_CREATE_TABLES`: default `true` para desarrollo. En `production` debe ser `false`; usa Alembic para migraciones.
- `ALBUM_JWT_SECRET_KEY`: secreto para firmar tokens; obligatorio en `production`.
- `ALBUM_JWT_ALGORITHM`: default `HS256`.
- `ALBUM_ACCESS_TOKEN_EXPIRE_MINUTES`: default `1440`.
- `ALBUM_CORS_ORIGINS`: obligatorio en produccion. Origenes permitidos separados por coma, por ejemplo `https://album.example.com,https://admin.example.com`.

En produccion la app falla al iniciar si conserva el secreto JWT default o si `ALBUM_AUTO_CREATE_TABLES=true`.

## Variables del frontend

- `VITE_API_BASE_URL`: URL publica del backend, por ejemplo `https://api.example.com/api`.

Vite lee esta variable en tiempo de build, asi que debe definirse al construir el bundle o la imagen Docker.

## Produccion, Postgres y migraciones

El backend esta preparado para Postgres usando SQLAlchemy + `psycopg` y migraciones con Alembic.

```bash
cd apps/backend
ALBUM_DATABASE_URL="postgresql+psycopg://album:secret@localhost:5432/album" alembic upgrade head
ALBUM_ENV=production \
ALBUM_AUTO_CREATE_TABLES=false \
ALBUM_DATABASE_URL="postgresql+psycopg://album:secret@localhost:5432/album" \
ALBUM_JWT_SECRET_KEY="un-secreto-largo-y-aleatorio" \
ALBUM_CORS_ORIGINS="https://album.example.com" \
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Docker

El `docker-compose.yml` incluye:

- `frontend`: Nginx sirviendo el build de React.
- `backend`: FastAPI + Alembic antes de iniciar.
- `postgres`: base de datos local para el compose.

```bash
docker compose up --build
```

Puertos locales:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`

Para un deploy real cambia `ALBUM_JWT_SECRET_KEY`, `ALBUM_DATABASE_URL`, `ALBUM_CORS_ORIGINS` y el build arg `VITE_API_BASE_URL`.

Imagenes publicadas:

- `frcgustavo/album-backend:0.1.0`
- `frcgustavo/album-frontend:0.1.0`

## API y autenticacion

La API vive en `/api` y la documentacion Swagger en `/docs`.

Flujo principal:

1. `POST /api/auth/register` crea cuenta con `email`, `name` y `password`.
2. `POST /api/auth/login` devuelve `access_token`.
3. El frontend envia `Authorization: Bearer <token>`.
4. El album se lee y guarda con rutas `/api/me/album`.

No hay guardado local permanente del album: si el backend no esta disponible, la app muestra error y conserva cambios pendientes en el navegador solo como borrador temporal.

## Persistencia normalizada y migracion

La persistencia v2 separa el catalogo del album (`albums`, `teams`, `stickers`) del progreso por usuario (`user_album_states`, `user_sticker_copies`, `custom_cracks`, `purchases`, `activity_log`). El contrato publico sigue siendo el JSON `AlbumState`, reconstruido desde las tablas normalizadas.

La tabla legacy `album_states` permanece como snapshot compatible. Cuando un usuario con estado legacy entra a la app, el backend marca `X-Album-Migration-Required: true`; el frontend muestra un modal obligatorio y llama `POST /api/me/album/migrate`. La migracion es idempotente, no borra el JSON legacy y mantiene estampas, repetidas, Coca-Cola, cracks personalizados, compras e historial.

## Arquitectura

El frontend esta organizado con una arquitectura hexagonal ligera:

- `apps/frontend/src/domain`: catalogo, estado del album y reglas puras de negocio.
- `apps/frontend/src/application`: casos de uso y hooks que coordinan sesion, carga y guardado remoto.
- `apps/frontend/src/infrastructure`: adaptadores externos y API remota.
- `apps/frontend/src/ui`: adaptador de entrada React, con `views` para pantallas y `components` para piezas reutilizables.
- `apps/frontend/src/main.jsx`: bootstrap de React.

El backend replica la separacion:

- `apps/backend/app/domain`: reglas puras, catalogo, estado y estadisticas.
- `apps/backend/app/application`: servicios/casos de uso y puertos como hashing y tokens.
- `apps/backend/app/infrastructure`: SQLAlchemy, repositorios, hashing y JWT concretos.
- `apps/backend/app/interfaces/http`: routers, schemas FastAPI y wiring de dependencias.

Esta separacion permite reemplazar el checklist, persistir en otro backend o agregar tests de reglas sin tocar los componentes.

## Fuentes consultadas

- AP News: reporta 980 stickers, 48 equipos, sobres de 7 y demanda de la coleccion.
- FourFourTwo: reporta lanzamiento, album de 112 paginas, 980 stickers, 68 especiales y 12 Coca-Cola.
- FIFA/Wikipedia como referencia secundaria para formato del torneo, sedes y 48 equipos.
