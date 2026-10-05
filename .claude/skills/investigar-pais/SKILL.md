---
name: investigar-pais
description: Investiga la situación de la vivienda en un país y redacta o actualiza su documento en docs/paises/ junto con sus notas de investigación. Usar cuando Ian pida investigar, documentar o actualizar un país.
argument-hint: <país>
---

# Investigar un país

Procedimiento para investigar un país (`$ARGUMENTS`) y dejar su documento público y sus notas listos para que Ian los revise. Antes de empezar, lee también:

- [contenido.md](contenido.md): qué hay que investigar en cada sección y qué trampas tiene cada dato.
- [estilo.md](estilo.md): cómo se redacta, se cita y se marca lo no contrastado.

## Principios

- **No se inventa nada.** Cada cifra y cada hecho sale de una fuente que se ha abierto y leído. Un fragmento de un buscador o un resumen no sirven como fuente.
- **Más vale tardar que fallar.** Se investiga sin prisa. Si un dato no se puede verificar, se deja fuera o se publica marcado como no contrastado, explicando por qué.
- **Preguntar antes que suponer.** Si hay una duda de alcance, de criterio o de interpretación, se para y se pregunta a Ian.
- **Nada de git.** No se hacen commits ni push. Ian revisa y hace commit él mismo.

## Ficheros

- Documento público: `docs/paises/<region>/<slug>.md`, a partir de `plantillas/pais.md`.
- Notas: `investigacion/<region>/<slug>.md`, a partir de `plantillas/investigacion.md`. Están fuera de `docs/`, así que no se publican.
- `slug`: nombre del país en español, en minúsculas, sin tildes y con guiones (`espana`, `paises-bajos`). `region`: una clave de `docs/.vitepress/regions.ts`.

Si los dos ficheros ya existen, es una **actualización**: parte de las notas, revisa si hay publicaciones nuevas de cada fuente y conserva lo que siga vigente.

## Fase 1: preparación (termina en un punto de control)

1. Crea o abre las notas.
2. **Mapa de fuentes.** Identifica los organismos de referencia del país: instituto de estadística, banco central, ministerio o agencia de vivienda, boletín oficial, parlamento (registro de votaciones), agencia tributaria, estadística judicial, censo y autoridades fiscales independientes. Añade las fuentes internacionales que cubran el país (Eurostat, OCDE, BIS, FMI, Banco Mundial, ONU-Hábitat). Anota qué publica cada uno y con qué periodicidad.
3. **Alcance subnacional.** Determina quién tiene competencias en vivienda y propone qué regiones y ciudades se cubren. El criterio es el marco nacional, las diferencias regionales que importan de verdad y las 4 o 5 ciudades principales.
4. **Punto de control.** Presenta a Ian el mapa de fuentes y el alcance, junto con cualquier duda. Espera su respuesta antes de seguir.

## Fase 2: investigación

Recorre las secciones de [contenido.md](contenido.md). Para cada dato:

1. **Busca en la fuente primaria.** Si hay una API o una tabla descargable oficial (por ejemplo, la API JSON del INE), úsala y apunta la consulta exacta. Si es un PDF, apunta la página.
2. **Lee el dato en la fuente,** con su definición, su unidad y su periodo de referencia. Comprueba si es una cifra provisional o si ha sido revisada.
3. **Contrasta las cifras que se repiten mucho** y las que sorprendan. Si dos fuentes no coinciden, anota las dos y averigua por qué: otra definición, otro periodo u otra metodología.
4. **Normas.** Las fechas y el texto vigente se sacan del boletín oficial, del texto consolidado si existe. Comprueba si la norma se ha modificado, derogado o recurrido. La votación se saca del parlamento.
5. **Registra cada dato en las notas,** en la tabla `Datos`, con su estado:
   - **verificado:** leído en la fuente primaria;
   - **fuente secundaria:** sacado de una fuente fiable que cita un dato primario que no se ha podido abrir;
   - **no contrastado:** se repite mucho, pero no se ha encontrado su origen. Solo se publica con badge y explicando por qué.
6. Lo que se mira y se descarta va a `Descartado`, con el motivo. Las dudas van a `Preguntas abiertas`, y si bloquean el trabajo se le preguntan a Ian en ese momento.

## Fase 3: redacción

1. Escribe el documento público siguiendo [estilo.md](estilo.md). La estructura de la plantilla es orientativa: las secciones se quitan, se fusionan o se añaden según el país.
2. Las secciones sin datos no se dejan en blanco ni en "Pendiente". Se dice qué no existe o no se publica ("No hay estadística oficial sobre…").
3. Escribe `summary` (una frase), pon `last_updated` a la fecha de hoy y ordena `sources` según su primera cita en el texto.

## Fase 4: comprobación

1. Cada cifra del documento público tiene su fila en `Datos`, y su `<Cite>` apunta a la fuente de esa fila.
2. Cada `id` citado existe en `sources`, y cada entrada de `sources` se cita al menos una vez.
3. `npm run build` termina sin errores, y `grep -r "fuente desconocida" docs/.vitepress/dist` no devuelve nada.
4. Relee el texto buscando adjetivos valorativos, afirmaciones causales sin una evaluación detrás y términos técnicos que no estén en el glosario.

## Fase 5: informe a Ian

Un mensaje breve con:

- las secciones cubiertas y las que tienen poca información;
- los datos no contrastados que se han publicado y por qué;
- lo descartado que pueda importar;
- las preguntas abiertas;
- la lista de ficheros cambiados, para su commit.
