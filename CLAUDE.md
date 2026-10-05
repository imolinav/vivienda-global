# Vivienda Global: contexto del proyecto

## Qué es

Proyecto personal de Ian. Una web pública que explica, país a país, cómo está la vivienda ahora mismo: compra, alquiler, política pública y contexto. El lector entra en un país y lee su situación actual. "Vivienda Global" es un nombre provisional.

## Decisiones tomadas y por qué

- **Un documento Markdown por país.** Es la única fuente de verdad: se investiga, se escribe en el `.md`, se actualiza ese mismo `.md` cuando cambia algo, y la web lo muestra tal cual.
- **Sin indicadores comparables entre países.** Cada país usa sus propios indicadores y medidas. No hay que forzar un set común de datos ni crear tablas comparativas. Por eso se descartó separar datos en JSON: no aportaba nada.
- **Solo en español por ahora.** Las traducciones no son un requisito. Si llegan, se harán con el i18n por carpetas de locale de VitePress, así que no hay que preparar nada ahora.
- **VitePress como generador.** Se eligió frente a Jekyll, Starlight, MkDocs Material o un sitio a medida porque da menú lateral, buscador local y diseño responsive sin trabajo, y porque Ian es desarrollador frontend senior con Vue y TypeScript.
- **Sitio estático desplegado con GitHub Actions en GitHub Pages**, en cada push a `main`.
- **Fuentes en el frontmatter, no en el cuerpo.** Así un futuro script de actualización puede leerlas y reescribirlas sin parsear prosa. Cada fuente tiene un `id` y se cita en el texto con `<Cite id="..." />`, que se muestra como `[n]` y enlaza a la lista numerada del final.
- **Investigación país a país con el skill `/investigar-pais`** (`.claude/skills/investigar-pais/`), no con un script. El skill fija el procedimiento, qué investigar y cómo redactar. Hay un punto de control con Ian antes de investigar: mapa de fuentes y alcance subnacional.
- **Notas de investigación en `investigacion/<region>/<pais>.md`**, fuera de `docs/`, así que no se publican. Relacionan cada cifra con el punto exacto de su fuente y guardan lo descartado y las preguntas abiertas.
- **Alcance por país:** marco nacional, diferencias regionales relevantes y las 4 o 5 ciudades principales. No se recorren todas las regiones.
- **Una sola página por país**, aunque sea larga. Se navega con el índice lateral.
- **Datos no contrastados:** se publican con `<Badge type="warning" text="no contrastado" />` y explicando el motivo.
- **Sin sección de "debates y datos".** Se probó en España (afirmaciones del debate público contrastadas con datos) y Ian la descartó el 2026-10-05: no aporta a lo que busca la web. Los datos útiles van en su sección temática.
- **Glosario por país**, como última sección, con anclas `{#g-termino}`.
- **Git:** todo va a `main`. Ian hace los commits y los push; Claude no.

## Estado del repo

El esqueleto está hecho y compila (`npm run build`), tanto en la raíz como bajo una subruta. El workflow de despliegue todavía no se ha ejecutado nunca.

- `docs/paises/<region>/<pais>.md`: un fichero por país. Regiones: `europa`, `asia`, `america`, `africa`, `oceania`.
- `docs/.vitepress/config.ts`: configuración del sitio e interfaz en español. La ruta base llega por la variable `BASE_PATH`, que el workflow toma de `actions/configure-pages`; el nombre del repo no está escrito en ningún sitio.
- `docs/.vitepress/regions.ts`: carpetas de región y sus etiquetas. Lo usan el menú y el listado.
- `docs/.vitepress/sidebar.ts`: genera el menú lateral leyendo las carpetas y el `title` de cada fichero. Se calcula al cargar la config, así que al crear un fichero hay que reiniciar `npm run dev`.
- `docs/.vitepress/theme/`: `CountryMeta.vue` (región y fecha sobre cada país), `CountrySources.vue` (lista numerada de fuentes al final), `Cite.vue` (cita `[n]` en el texto; si el `id` no existe, muestra "fuente desconocida"), `sources.ts` (tipo y ancla compartidos), `CountryList.vue` con `countries.data.ts` (listado de `docs/paises/index.md`).
- `plantillas/pais.md`: plantilla para países nuevos. `plantillas/investigacion.md`: plantilla de las notas.
- `.claude/skills/investigar-pais/`: `SKILL.md` (procedimiento), `contenido.md` (qué investigar), `estilo.md` (redacción, citas, cifras, glosario).
- `.github/workflows/deploy.yml`: build y despliegue.

`docs/paises/europa/espana.md` tiene una primera versión completa (2026-10-05), con sus notas en `investigacion/europa/espana.md`. Hay que revisar la parte política después de las elecciones del 29 de noviembre de 2026. `docs/paises/asia/japon.md` sigue siendo solo estructura, con la plantilla antigua.

## Frontmatter de cada país

    title: España
    summary: Una frase para el listado.
    last_updated: 2026-10-05
    sources:
      - id: ine-ipv
        title: INE — Índice de Precios de Vivienda
        url: https://...
        date: "2026"

`sources` se ordena por primera cita en el texto. Las secciones de `plantillas/pais.md` son orientativas: se quitan, se fusionan o se añaden según lo que tenga sentido en cada país.

## Reglas de trabajo

- **No inventes cifras ni hechos.** Todo dato tiene que salir de una fuente consultada y quedar listado en `sources`. Si algo no se puede verificar, se deja fuera o se marca como pendiente.
- Prioriza fuentes oficiales (institutos nacionales de estadística, bancos centrales, ministerios, Eurostat, OCDE, BIS) frente a prensa o portales inmobiliarios.
- Al modificar un país, actualiza `last_updated`.
- Contenido en español. Código, nombres y comentarios en inglés, nivel senior, con comentarios que expliquen qué hace cada parte y cómo se relaciona con el resto (máximo 6–8 líneas por comentario).
- Ian es desarrollador experimentado: sin explicaciones básicas, directo al grano.
- Ante una duda de alcance o de diseño, pregunta antes de asumir.
- No añadas complejidad que no se haya pedido: ni CMS, ni base de datos, ni capa de datos estructurados, ni i18n.

## Pendiente de decidir

- **Visibilidad del repo.** GitHub Pages con repo privado requiere plan de pago; en cuenta Free solo funciona con repo público. Si acaba siendo privado sin plan de pago, hay que desplegar en Cloudflare Pages, Netlify o Vercel, eliminar el workflow y `BASE_PATH`, y reescribir `docs/sobre.md`, que ahora habla de repositorio público y pull requests.
- **Nombre definitivo** (se cambia en `config.ts` y `docs/index.md`).
- **Orden de los países después de España.**

## Futuro, no implementar todavía

Actualización automática: un job programado en GitHub Actions que revise fuentes por país y abra un pull request con los cambios propuestos en el `.md`, siempre con revisión humana antes de publicar. Nunca commits automáticos directos a `main`. Los datos de vivienda se publican mensual o trimestralmente, así que el job detecta publicaciones nuevas más que cambios diarios.