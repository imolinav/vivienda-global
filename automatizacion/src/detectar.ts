// Step 1 of the daily job: run every watcher of every configured country
// and write the new items to automatizacion/salida/novedades.json. The
// workflow only starts the agent when that file is not empty. State files
// (automatizacion/estado/) are updated here and committed by the workflow,
// so an item is reported once even if the agent later fails on it.
//
// Usage: npx tsx automatizacion/src/detectar.ts [--pais espana] [--inicializar] [--desde-boe AAAA-MM-DD]
// --inicializar records the current state without reporting anything, for a
// newly configured country. --desde-boe re-scans the BOE from the day after
// that date, to test the agent on known news or recover a missed period.
import fs from 'node:fs'
import path from 'node:path'
import { argumento, bandera, cargarPaises, rutaEstado, SALIDA } from './lib/config'
import { vigilarBOE, vigilarConsolidadas, vigilarPaginas, vigilarSeries, type Estado, type Novedad } from './vigilantes/vigilantes'

const UMBRAL_FALLOS = 3

const salida: (Novedad & { pais: string })[] = []
const avisos: string[] = []

for (const pais of cargarPaises(argumento('pais'))) {
  const ruta = rutaEstado(pais)
  const estado: Estado = fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')) : {}
  estado.fallos ??= {}
  const desde = argumento('desde-boe')
  if (desde) estado.boe = { ultimaFecha: desde }
  const v = pais.vigilancia
  const tareas: [string, () => Promise<Novedad[]>][] = []
  if (v.boe) tareas.push(['boe', () => vigilarBOE(v.boe!, estado)])
  if (v.consolidadas) tareas.push(['consolidadas', () => vigilarConsolidadas(v.consolidadas!, estado)])
  if (v.series) tareas.push(['series', () => vigilarSeries(v.series!, estado)])
  if (v.paginas) tareas.push(['paginas', () => vigilarPaginas(v.paginas!, estado)])

  for (const [nombre, tarea] of tareas) {
    try {
      const nuevas = await tarea()
      delete estado.fallos[nombre]
      if (!bandera('inicializar')) salida.push(...nuevas.map((n) => ({ ...n, pais: pais.pais })))
      console.log(`${pais.pais}/${nombre}: ${nuevas.length} novedades`)
    } catch (e) {
      // One broken source must not stop the others; repeated failures
      // become a warning that the workflow turns into an issue.
      estado.fallos[nombre] = (estado.fallos[nombre] ?? 0) + 1
      console.error(`${pais.pais}/${nombre}: ${e}`)
      if (estado.fallos[nombre] === UMBRAL_FALLOS) avisos.push(`${pais.pais}/${nombre} falla desde hace ${UMBRAL_FALLOS} días: ${e}`)
    }
  }
  fs.mkdirSync(path.dirname(ruta), { recursive: true })
  fs.writeFileSync(ruta, `${JSON.stringify(estado, null, 2)}\n`)
}

fs.mkdirSync(SALIDA, { recursive: true })
fs.writeFileSync(path.join(SALIDA, 'novedades.json'), `${JSON.stringify(salida, null, 2)}\n`)
if (avisos.length) fs.writeFileSync(path.join(SALIDA, 'avisos.md'), avisos.map((a) => `- ${a}`).join('\n') + '\n')
console.log(`Total: ${salida.length} novedades`)
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `novedades=${salida.length}\n`)
