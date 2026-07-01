# Panini Mundial 2026 MX

Aplicacion React para registrar el avance personal del album Panini de la Copa Mundial FIFA 2026, con conteo de calcomanias pegadas, repetidas, faltantes, especiales, estrellas y Coca-Cola.

## Investigacion base

- La Copa Mundial 2026 se juega en Canada, Mexico y Estados Unidos, con 48 equipos, 16 ciudades sede, 104 partidos y formato de 12 grupos de 4.
- La edicion Panini 2026 fue reportada por medios como la mas grande hasta ahora: 980 stickers, album de 112 paginas, sobres de 7 stickers y 68 stickers especiales.
- La cobertura consultada menciona una doble pagina de 12 stickers Coca-Cola disponibles por promocion.
- No encontre un checklist oficial completo y publico de la edicion Mexico con numeracion, nombres y orden exacto. Por eso el catalogo incluido es una estructura versionable de 980 espacios: 36 apertura/sedes, 864 equipos, 68 estrellas y 12 Coca-Cola.

## Plan de implementacion

1. Crear MVP frontend con React y persistencia local.
2. Modelar el album como catalogo versionable de 980 espacios.
3. Permitir captura rapida de una o muchas calcomanias por numero.
4. Contar copias para distinguir pegadas y repetidas.
5. Mostrar progreso, faltantes, repetidas, estrellas y Coca-Cola.
6. Agregar busqueda, filtros por estado/tipo/equipo e importacion/exportacion JSON.
7. Cuando Panini Mexico publique el checklist oficial, reemplazar `buildCatalog()` por un archivo `catalog.mx-2026.json` validado.

## Desarrollo

```bash
pnpm install
pnpm dev
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

## Arquitectura

El frontend esta organizado con una arquitectura hexagonal ligera:

- `apps/frontend/src/domain`: catalogo, estado del album y reglas puras de negocio.
- `apps/frontend/src/application`: casos de uso que coordinan operaciones del album.
- `apps/frontend/src/infrastructure`: adaptadores externos, persistencia local y API remota.
- `apps/frontend/src/ui`: adaptador de entrada React, con `views` para pantallas y `components` para piezas reutilizables.
- `apps/frontend/src/main.jsx`: bootstrap de React.

El backend replica la separacion hexagonal:

- `apps/backend/app/domain`: reglas puras, catalogo, estado y estadisticas.
- `apps/backend/app/application`: servicios/casos de uso.
- `apps/backend/app/infrastructure`: SQLite, SQLAlchemy y repositorios.
- `apps/backend/app/interfaces/http`: routers y schemas FastAPI.

Esta separacion permite reemplazar el checklist, persistir en otro backend o agregar tests de reglas sin tocar los componentes.

## Fuentes consultadas

- AP News: reporta 980 stickers, 48 equipos, sobres de 7 y demanda de la coleccion.
- FourFourTwo: reporta lanzamiento, album de 112 paginas, 980 stickers, 68 especiales y 12 Coca-Cola.
- FIFA/Wikipedia como referencia secundaria para formato del torneo, sedes y 48 equipos.
