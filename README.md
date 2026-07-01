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

## Arquitectura

La app esta organizada con una arquitectura hexagonal ligera:

- `src/domain`: catalogo, estado del album y reglas puras de negocio.
- `src/application`: casos de uso que coordinan operaciones del album.
- `src/infrastructure`: adaptadores externos, por ahora persistencia en `localStorage`.
- `src/ui`: adaptador de entrada React, con `views` para pantallas y `components` para piezas reutilizables.
- `src/main.jsx`: bootstrap de React.

Esta separacion permite reemplazar el checklist, persistir en otro backend o agregar tests de reglas sin tocar los componentes.

## Fuentes consultadas

- AP News: reporta 980 stickers, 48 equipos, sobres de 7 y demanda de la coleccion.
- FourFourTwo: reporta lanzamiento, album de 112 paginas, 980 stickers, 68 especiales y 12 Coca-Cola.
- FIFA/Wikipedia como referencia secundaria para formato del torneo, sedes y 48 equipos.
