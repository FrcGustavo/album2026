# Panini Mundial 2026 MX

Aplicacion React + FastAPI para registrar el avance personal del album Panini de la Copa Mundial FIFA 2026, con conteo de calcomanias pegadas, repetidas, faltantes, especiales, estrellas y Coca-Cola. El album se guarda en el backend con autenticacion JWT.

## Investigacion base

- La Copa Mundial 2026 se juega en Canada, Mexico y Estados Unidos, con 48 equipos, 16 ciudades sede, 104 partidos y formato de 12 grupos de 4.
- La edicion Panini 2026 fue reportada por medios como la mas grande hasta ahora: 980 stickers, album de 112 paginas, sobres de 7 stickers y 68 stickers especiales.
- La cobertura consultada menciona una doble pagina de 12 stickers Coca-Cola disponibles por promocion.
- No encontre un checklist oficial completo y publico de la edicion Mexico con numeracion, nombres y orden exacto. Por eso el catalogo incluido es una estructura versionable de 980 espacios: 36 apertura/sedes, 864 equipos, 68 estrellas y 12 Coca-Cola.

## Plan de implementacion

1. Crear MVP frontend con React.
2. Modelar el album como catalogo versionable de 980 espacios.
3. Permitir captura rapida de una o muchas calcomanias por numero.
4. Contar copias para distinguir pegadas y repetidas.
5. Mostrar progreso, faltantes, repetidas, estrellas y Coca-Cola.
6. Agregar busqueda, filtros por estado/tipo/equipo e importacion/exportacion JSON.
7. Cuando Panini Mexico publique el checklist oficial, reemplazar `buildCatalog()` por un archivo `catalog.mx-2026.json` validado.

## Desarrollo

```bash
pnpm install
cd apps/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
cd ../..
pnpm dev:all
```

El monorepo separa las apps en:

- `apps/frontend`: app React + Vite.
- `apps/backend`: API FastAPI + SQLite.

Scripts desde la raiz:

- `pnpm dev`: frontend.
- `pnpm dev:api`: backend en `127.0.0.1:8000`.
- `pnpm dev:all`: frontend y backend.
- `pnpm build`: build del frontend.
- `pnpm test:api`: tests del backend.

Variables del backend:

- `PANINI_ENV`: default `development`. En `production` exige un secreto JWT explicito.
- `PANINI_DATABASE_URL`: default `sqlite:///./data/panini.sqlite`.
- `PANINI_JWT_SECRET_KEY`: secreto para firmar tokens; obligatorio en `production`.
- `PANINI_JWT_ALGORITHM`: default `HS256`.
- `PANINI_ACCESS_TOKEN_EXPIRE_MINUTES`: default `1440`.

## API y autenticacion

La API vive en `http://127.0.0.1:8000/api` y la documentacion Swagger en `http://127.0.0.1:8000/docs`.

Flujo principal:

1. `POST /api/auth/register` crea cuenta con `email`, `name` y `password`.
2. `POST /api/auth/login` devuelve `access_token`.
3. El frontend envia `Authorization: Bearer <token>`.
4. El album se lee y guarda con rutas `/api/me/album`.

No hay guardado local del album: si el backend no esta disponible, la app muestra error y no persiste cambios en el navegador.

## Arquitectura

El frontend esta organizado con una arquitectura hexagonal ligera:

- `apps/frontend/src/domain`: catalogo, estado del album y reglas puras de negocio.
- `apps/frontend/src/application`: casos de uso y hooks que coordinan sesion, carga y guardado remoto.
- `apps/frontend/src/infrastructure`: adaptadores externos y API remota.
- `apps/frontend/src/ui`: adaptador de entrada React, con `views` para pantallas y `components` para piezas reutilizables.
- `apps/frontend/src/main.jsx`: bootstrap de React.

El backend replica la separacion hexagonal:

- `apps/backend/app/domain`: reglas puras, catalogo, estado y estadisticas.
- `apps/backend/app/application`: servicios/casos de uso y puertos como hashing y tokens.
- `apps/backend/app/infrastructure`: SQLite, SQLAlchemy, repositorios, hashing y JWT concretos.
- `apps/backend/app/interfaces/http`: routers, schemas FastAPI y wiring de dependencias.

Esta separacion permite reemplazar el checklist, persistir en otro backend o agregar tests de reglas sin tocar los componentes.

## Fuentes consultadas

- AP News: reporta 980 stickers, 48 equipos, sobres de 7 y demanda de la coleccion.
- FourFourTwo: reporta lanzamiento, album de 112 paginas, 980 stickers, 68 especiales y 12 Coca-Cola.
- FIFA/Wikipedia como referencia secundaria para formato del torneo, sedes y 48 equipos.
