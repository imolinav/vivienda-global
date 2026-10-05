---
name: actualizar-pais
description: Incorpora a los documentos de país las novedades detectadas por la actualización automática diaria (automatizacion/salida/novedades.json). Lo ejecuta el workflow de GitHub Actions; no es para uso manual.
allowed-tools: Read, Edit, Write, Glob, Grep, WebSearch, Bash(npx tsx automatizacion/src/lib/texto.ts:*), Bash(npx tsx automatizacion/src/ordenar-fuentes.ts:*), Bash(npx tsx automatizacion/src/verificar.ts:*)
---

# Actualizar países con las novedades del día

Trabajas sin supervisión dentro del workflow diario. Lo que dejes en los ficheros se publica si pasa `automatizacion/src/verificar.ts`. Si no pasa, se descarta y se abre un issue para Ian. Antes de empezar, lee:

- `CLAUDE.md`;
- `.claude/skills/investigar-pais/contenido.md`;
- `.claude/skills/investigar-pais/estilo.md`.

Las reglas de esos ficheros siguen valiendo aquí.

## Entrada

`automatizacion/salida/novedades.json` contiene una lista de novedades. Cada una tiene `pais`, `tipo`, `titulo`, `url` y `detalle`. Los tipos son:

- `boe`: una disposición del BOE cuyo título coincide con las palabras clave del país;
- `consolidada`: una ley clave tiene una nueva versión consolidada; hay que averiguar qué ha cambiado;
- `serie`: una estadística del INE ha publicado un periodo nuevo;
- `pagina`: ha aparecido una publicación nueva (un informe, un barómetro, un fichero de datos).

Para cada país, el documento y las notas están en las rutas `documento` y `notas` de `investigacion/<region>/<pais>.fuentes.yml`.

## Qué hacer con cada novedad

1. **Lee la fuente original** con `npx tsx automatizacion/src/lib/texto.ts <url> "término" "otro término"`. El comando guarda el texto completo en `automatizacion/.cache/`, que puedes leer con Read o Grep, y te muestra el contexto de cada término.
2. **Decide si es relevante** para la situación de la vivienda que describe el documento. Muchas no lo son: convenios, subvenciones puntuales, normas que solo mencionan la vivienda de pasada.
3. **Si es relevante, actualiza solo lo afectado.** Corrige la frase o el párrafo, o añade una frase en la sección que corresponda. No reescribas secciones enteras ni cambies la estructura.
4. **Fuentes.** Cita con `<Cite id="..." />` y añade la fuente al frontmatter `sources` con `id`, `title`, `url` y `date`. Después ejecuta `npx tsx automatizacion/src/ordenar-fuentes.ts`.
5. **Notas.** En las notas de investigación:
   - añade una fila en `Datos` por cada cifra nueva y otra en `Normas` por cada norma nueva o modificada;
   - añade al principio de `## Historial de actualizaciones` una línea: `AAAA-MM-DD · <novedad> · <qué has cambiado>`.
6. **Fecha.** Pon `last_updated` a la fecha de hoy en el documento que hayas modificado.

## Evidencias, obligatorias

`verificar.ts` comprueba que **cada número nuevo del texto aparece en una cita literal de su fuente**. Por cada cifra nueva, añade un objeto a `automatizacion/salida/evidencias.json`, que es un array JSON:

```json
[{ "url": "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-12345", "cita": "texto copiado literalmente de la fuente que contiene la cifra" }]
```

- La `cita` tiene que estar copiada tal cual del texto que devuelve `texto.ts` para esa `url`.
- No calcules cifras propias. Si una cifra necesita un cálculo, déjala fuera y explícalo en las dudas.

## Lo que no debes tocar

- **El bloque `datos` del frontmatter y las cifras que se muestran con `<Dato>`.** Las actualiza otro paso, sin IA.
- **Novedades que exijan reescribir una parte grande del documento,** como un cambio de Gobierno tras unas elecciones, una ley que sustituye a la principal o la reorganización de una sección. Descríbelas en las dudas para Ian y no edites.
- **Información que no puedas leer en la fuente original.** Si una novedad remite a otro documento que no puedes abrir, déjala en las dudas.
- **Git.** No hagas commits ni push; de eso se encarga el workflow.

## Salida

- `automatizacion/salida/informe.md`: una línea por novedad, con la decisión (incorporada, no relevante o en dudas) y una frase de motivo. Siempre, aunque no cambies nada.
- `automatizacion/salida/dudas.md`: solo si algo necesita la decisión de Ian. Cada punto tiene que poder entenderse sin contexto e incluir el enlace a la fuente.

Antes de terminar, ejecuta `npx tsx automatizacion/src/verificar.ts --base HEAD`. Si falla por algo tuyo, corrígelo o deshaz ese cambio y anótalo en las dudas.
