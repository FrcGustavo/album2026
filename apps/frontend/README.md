# Album Frontend

Interfaz web del album Mundial 2026 MX, construida con React + Vite.

## Ejecutar solo el frontend

Desde la raiz del repositorio:

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:5173](http://localhost:5173).

El frontend necesita un backend disponible para iniciar sesion y guardar el album. En desarrollo, el backend corre normalmente en `http://127.0.0.1:8000/api`.

## Ejecutar frontend + backend

Desde la raiz:

```bash
pnpm dev:all
```

Esto levanta:

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`

## Configuracion

Variable principal:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Si no se define, el frontend usa `http://127.0.0.1:8000/api` por defecto.

En produccion esta variable debe definirse antes de construir el bundle o la imagen Docker.

## Scripts utiles

```bash
pnpm --dir apps/frontend dev
pnpm --dir apps/frontend build
pnpm --dir apps/frontend test
pnpm --dir apps/frontend lint
```

## Carpetas importantes

- `src/domain`: reglas y estado del album.
- `src/application`: hooks y casos de uso.
- `src/infrastructure`: comunicacion con la API.
- `src/ui`: pantallas y componentes React.
