// Step 2 of the daily job: recompute every figure declared in the countries'
// *.fuentes.yml and write the ones that changed into the page frontmatter
// (`datos`). This step involves no AI: values come straight from the
// official API or file and the prose reads them through <Dato>. Each
// change is logged in the country's research notes and summarised in
// automatizacion/salida/datos.md for the commit message.
//
// Usage: npx tsx automatizacion/src/actualizar-datos.ts [--pais espana]
import fs from 'node:fs'
import path from 'node:path'
import { isMap } from 'yaml'
import { formatDato } from '../../docs/.vitepress/theme/datos'
import { argumento, cargarPaises, hoyISO, RAIZ, rutaEstado, SALIDA } from './lib/config'
import { anotarHistorial, escribirPagina, leerPagina } from './lib/documento'
import { calcularDato } from './origenes/calcular'
import type { Estado } from './vigilantes/vigilantes'

const UMBRAL_FALLOS = 3

const resumen: string[] = []
const avisos: string[] = []

for (const pais of cargarPaises(argumento('pais'))) {
  const rutaDoc = path.join(RAIZ, pais.documento)
  const pagina = leerPagina(rutaDoc)
  const historial: string[] = []
  // Failure counters live in the same state file as the watchers'.
  const rutaEst = rutaEstado(pais)
  const estado: Estado = fs.existsSync(rutaEst) ? JSON.parse(fs.readFileSync(rutaEst, 'utf8')) : {}
  estado.fallos ??= {}
  if (!isMap(pagina.doc.get('datos'))) pagina.doc.set('datos', pagina.doc.createNode({}))

  for (const [id, cfg] of Object.entries(pais.datos)) {
    let nuevo
    try {
      nuevo = await calcularDato(cfg)
      delete estado.fallos[`dato:${id}`]
    } catch (e) {
      // Keep the previous value: a stale figure with its period is still
      // correct, a missing one would break the page.
      const n = (estado.fallos[`dato:${id}`] = (estado.fallos[`dato:${id}`] ?? 0) + 1)
      console.error(`${pais.pais}/${id}: ${e}`)
      if (n === UMBRAL_FALLOS) avisos.push(`${pais.pais}/dato ${id} falla desde hace ${UMBRAL_FALLOS} días: ${e}`)
      continue
    }
    const formato = { unidad: cfg.unidad, decimales: cfg.decimales, signo: cfg.signo }
    const previo = pagina.doc.getIn(['datos', id]) as unknown
    const anterior = previo ? (pagina.doc.getIn(['datos', id]) as { toJSON(): Record<string, unknown> }).toJSON() : undefined
    const entrada = Object.fromEntries(
      Object.entries({ valor: nuevo.valor, periodo: nuevo.periodo, fuente: cfg.fuente, ...formato }).filter(([, v]) => v !== undefined),
    )
    if (JSON.stringify(anterior) === JSON.stringify(entrada)) continue
    pagina.doc.setIn(['datos', id], pagina.doc.createNode(entrada))
    const texto = `${formatDato(entrada as never)} (${nuevo.periodo})`
    const antes = anterior ? `${formatDato(anterior as never)} (${anterior.periodo})` : 'sin valor'
    historial.push(`${hoyISO()} · dato \`${id}\`: ${antes} → ${texto}. Fuente: \`${cfg.fuente}\`.`)
    resumen.push(`${pais.pais}: ${id} ${antes} → ${texto}`)
  }

  if (historial.length) {
    pagina.doc.set('last_updated', hoyISO())
    escribirPagina(rutaDoc, pagina)
    anotarHistorial(path.join(RAIZ, pais.notas), historial)
  }
  fs.mkdirSync(path.dirname(rutaEst), { recursive: true })
  fs.writeFileSync(rutaEst, `${JSON.stringify(estado, null, 2)}\n`)
  console.log(`${pais.pais}: ${historial.length} datos actualizados`)
}

fs.mkdirSync(SALIDA, { recursive: true })
fs.writeFileSync(path.join(SALIDA, 'datos.md'), resumen.map((r) => `- ${r}`).join('\n') + (resumen.length ? '\n' : ''))
if (avisos.length) fs.appendFileSync(path.join(SALIDA, 'avisos.md'), avisos.map((a) => `- ${a}`).join('\n') + '\n')
