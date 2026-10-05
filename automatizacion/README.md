# Actualización automática

Cada día, el workflow `.github/workflows/actualizar.yml` revisa si hay novedades para cada país, actualiza lo que puede, verifica el resultado y lo publica en `main` sin intervención. Lo que no pasa los controles no se publica y se convierte en un issue.

## Qué hace cada día

1. **Detectar** (`src/detectar.ts`, sin IA). Para cada país configurado:
   - revisa el sumario del BOE con sus palabras clave;
   - comprueba si sus leyes clave tienen una nueva versión consolidada;
   - mira si han aparecido publicaciones nuevas en las páginas vigiladas.

   Escribe lo encontrado en `salida/novedades.json`.
2. **Actualizar datos** (`src/actualizar-datos.ts`, sin IA). Recalcula las cifras declaradas en `datos` (APIs del INE y ficheros CSV oficiales) y escribe en el frontmatter de la página las que cambian. El texto las muestra con `<Dato id="..." />`, así que no hay que tocar la prosa. Estos cambios se guardan en un commit local que sirve de punto de control.
3. **Agente** (Claude Code, solo si hay novedades). Ejecuta el skill `.claude/skills/actualizar-pais`: lee cada novedad en su fuente original, decide si es relevante y edita lo mínimo. Deja una evidencia (URL y cita literal) por cada cifra nueva.
4. **Verificar** (`src/verificar.ts`). Comprueba:
   - la estructura de todas las páginas (fuentes, citas y datos) y que la web compila sin marcas de error;
   - que el agente no ha tocado `datos`, no ha borrado secciones, no ha reescrito más del 30 % de un documento, ha actualizado las notas y ha respaldado cada cifra nueva con una cita que aparece de verdad en la fuente.
5. **Publicar** (`publicar.sh`):
   - si todo pasa, hace push a `main` y lanza el despliegue;
   - si no, descarta los cambios del agente, publica solo los datos (si verifican) y abre un issue;
   - también abre un issue si el agente deja dudas o si una fuente falla tres días seguidos.

El estado de los vigilantes (qué se ha visto ya) se guarda en la rama `automatizacion-estado`, no en `main`, para que el historial principal solo tenga cambios de contenido.

## Añadir un país

1. Investiga el país con el skill `investigar-pais`.
2. Crea `investigacion/<region>/<pais>.fuentes.yml` a partir de `plantillas/pais.fuentes.yml`:
   - las cifras con una fuente consultable por API o fichero van en `datos`;
   - las fuentes que hay que vigilar van en `vigilancia`.
3. En el documento, sustituye esas cifras por `<Dato id="..." />` (y `<Dato id="..." periodo />` para el periodo).
4. Ejecuta `npm run auto:datos -- --pais <pais>` y `npm run auto:verificar`.

No hace falta código nuevo salvo que el país use un tipo de fuente que aún no exista. Por ejemplo, la API estadística de otro país iría en `src/origenes/`.

## Uso en local

```sh
npm run auto:datos                    # recalcula los datos de todos los países
npm run auto:detectar -- --inicializar  # registra el estado actual sin reportar novedades
npm run auto:verificar -- --html      # tras npm run build
npm run auto:texto -- <url> "término" # lo que usa el agente para leer una fuente
npm run auto:tipos                    # comprobación de tipos
```

## Configuración en GitHub

- **Secret `CLAUDE_CODE_OAUTH_TOKEN`:** el token de la suscripción Claude Pro, generado con `claude setup-token`. El agente consume del uso del plan, no se factura como API. Si llega al límite, ese día falla de forma segura: se abre un issue y solo se publican las cifras automáticas. Para pasar a facturación por API, se cambia en el workflow por `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}`.
- **Variable `MODELO_AGENTE` (opcional):** modelo del agente. Por defecto, `claude-opus-5-5`.
- **Settings → Actions → General → Workflow permissions:** "Read and write permissions".
