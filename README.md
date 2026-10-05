# Vivienda Global

El estado de la vivienda, país a país. Un documento Markdown por país, publicado con VitePress en GitHub Pages.

## Desarrollo

```bash
npm install
npm run dev      # servidor local con recarga
npm run build    # genera docs/.vitepress/dist
npm run preview  # sirve el build
```

## Añadir un país

1. Copia `plantillas/pais.md` a `docs/paises/<region>/<pais>.md` (regiones: `europa`, `asia`, `america`, `africa`, `oceania`).
2. Rellena el frontmatter y las secciones. Las secciones son orientativas: quita o añade las que hagan falta.
3. Reinicia `npm run dev` para que aparezca en el menú (solo hace falta al crear ficheros, no al editarlos).

El menú lateral, el listado de países, la fecha de actualización y el bloque de fuentes se generan solos a partir del frontmatter.

## Actualizar un país

Edita el `.md`, cambia `last_updated` y añade la fuente nueva en `sources`.

## Publicar

En GitHub: **Settings → Pages → Source: GitHub Actions**. A partir de ahí, cada push a `main` despliega el sitio.

## Estructura

```
docs/
  index.md                 portada
  sobre.md                 sobre el proyecto
  paises/<region>/<pais>.md
  .vitepress/
    config.ts              configuración del sitio
    regions.ts             regiones y sus etiquetas
    sidebar.ts             menú generado desde las carpetas
    theme/                 componentes (listado, metadatos, fuentes)
plantillas/pais.md         plantilla de documento
.github/workflows/deploy.yml
```
