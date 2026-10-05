// Gatekeeper of the daily job: nothing is pushed unless this passes. It
// runs in two layers:
//
// 1. Structure, for every country page: valid frontmatter, every <Cite>
//    and <Dato> resolvable, every source cited, sources in citation order
//    and, with --html, no unresolved markers in the built site.
// 2. Agent edits, with --base <commit>: compared with that commit, the
//    agent may not touch `datos`, drop sections, rewrite most of a page or
//    remove many sources, must log its work in the notes, and every new
//    number in the text must appear in a quote that verifiably comes from
//    the cited document (automatizacion/salida/evidencias.json).
//
// The report goes to automatizacion/salida/verificacion.md; the exit code
// tells the workflow whether to publish or to open an issue instead.
//
// Usage: npx tsx automatizacion/src/verificar.ts [--html] [--base <ref>]
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { parseDocument } from 'yaml'
import { argumento, bandera, cargarPaises, RAIZ, SALIDA, type PaisConfig } from './lib/config'
import { aLF, idsCitados, idsDatos, leerPagina } from './lib/documento'
import { lecturasDeCita, limpiarCuerpo, numerosDePagina, respaldado } from './lib/numeros'
import { normalizar, urlATexto } from './lib/texto'

const MAX_CAMBIO = 0.3
const MAX_FUENTES_RETIRADAS = 2

const errores: string[] = []
const error = (pais: string, msg: string) => errores.push(`**${pais}**: ${msg}`)

interface Fuente {
  id: string
  title: string
  url: string
  date: string
}

function estructura(pais: PaisConfig): void {
  const { doc, cuerpo } = leerPagina(path.join(RAIZ, pais.documento))
  const fm = doc.toJSON() as Record<string, unknown>
  for (const campo of ['title', 'summary']) if (typeof fm[campo] !== 'string' || !fm[campo]) error(pais.pais, `falta \`${campo}\``)
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(fm.last_updated instanceof Date ? fm.last_updated.toISOString() : fm.last_updated)))
    error(pais.pais, '`last_updated` no es una fecha AAAA-MM-DD')
  const fuentes = (fm.sources ?? []) as Fuente[]
  const ids = fuentes.map((f) => f.id)
  for (const f of fuentes) {
    if (!f.id || !f.title || !f.date || !/^https?:\/\//.test(f.url ?? '')) error(pais.pais, `fuente incompleta: ${JSON.stringify(f)}`)
  }
  for (const dup of ids.filter((id, i) => ids.indexOf(id) !== i)) error(pais.pais, `fuente duplicada \`${dup}\``)
  const citados = idsCitados(cuerpo)
  for (const id of citados.filter((c) => !ids.includes(c))) error(pais.pais, `<Cite> sin fuente: \`${id}\``)
  for (const id of ids.filter((i) => !citados.includes(i))) error(pais.pais, `fuente no citada: \`${id}\``)
  if (citados.filter((c) => ids.includes(c)).join() !== ids.filter((i) => citados.includes(i)).join())
    error(pais.pais, 'las fuentes no siguen el orden de primera cita (ejecuta ordenar-fuentes.ts)')
  const datos = (fm.datos ?? {}) as Record<string, { valor: unknown; periodo: unknown; fuente: string }>
  for (const [id, d] of Object.entries(datos)) {
    if (typeof d.valor !== 'number' || typeof d.periodo !== 'string') error(pais.pais, `dato mal formado: \`${id}\``)
    if (!ids.includes(d.fuente)) error(pais.pais, `el dato \`${id}\` apunta a una fuente inexistente \`${d.fuente}\``)
  }
  for (const id of idsDatos(cuerpo).filter((d) => !(d in datos))) error(pais.pais, `<Dato> sin valor: \`${id}\``)
}

function html(): void {
  const dist = path.join(RAIZ, 'docs/.vitepress/dist')
  const recorrer = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? recorrer(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []))
  for (const f of recorrer(dist)) {
    const t = fs.readFileSync(f, 'utf8')
    for (const marca of ['fuente desconocida', 'dato desconocido']) if (t.includes(marca)) error(path.relative(dist, f), `contiene «${marca}»`)
  }
}

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' })
}

function enBase(base: string, ruta: string): string | undefined {
  try {
    return aLF(git('show', `${base}:${ruta}`))
  } catch {
    return undefined
  }
}

interface Evidencia {
  url: string
  cita: string
}

async function evidenciasValidas(): Promise<number[]> {
  const ruta = path.join(SALIDA, 'evidencias.json')
  if (!fs.existsSync(ruta)) return []
  const lista = JSON.parse(fs.readFileSync(ruta, 'utf8')) as Evidencia[]
  const lecturas: number[] = []
  for (const ev of lista) {
    let texto: string
    try {
      texto = normalizar(await urlATexto(ev.url))
    } catch (e) {
      error('evidencias', `no se pudo leer ${ev.url}: ${e}`)
      continue
    }
    const cita = normalizar(ev.cita)
    // PDFs break lines and words unpredictably; when the literal quote is
    // not found, accept it only if all its numbers and nearly all its words
    // are in the document.
    const literal = texto.includes(cita)
    const palabras = cita.split(' ').filter((w) => w.length > 3)
    const presentes = palabras.filter((w) => texto.includes(w)).length / Math.max(palabras.length, 1)
    const numeros = (cita.match(/\d[\d.,]*/g) ?? []).every((n) => texto.includes(n))
    if (literal || (numeros && presentes >= 0.9)) lecturas.push(...lecturasDeCita(ev.cita))
    else error('evidencias', `la cita no aparece en ${ev.url}: «${ev.cita.slice(0, 160)}»`)
  }
  return lecturas
}

async function cambiosDelAgente(base: string): Promise<void> {
  const cambiados = git('diff', '--name-only', base, '--').split('\n').filter(Boolean)
  const lecturas = await evidenciasValidas()
  for (const pais of cargarPaises()) {
    if (!cambiados.includes(pais.documento)) continue
    const antesTexto = enBase(base, pais.documento)
    if (!antesTexto) continue
    const [, fmAntes, cuerpoAntes] = antesTexto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? []
    const antes = parseDocument(fmAntes).toJSON() as Record<string, unknown>
    const ahora = leerPagina(path.join(RAIZ, pais.documento))
    const fmAhora = ahora.doc.toJSON() as Record<string, unknown>

    if (JSON.stringify(antes.datos ?? {}) !== JSON.stringify(fmAhora.datos ?? {}))
      error(pais.pais, 'el agente ha modificado `datos`, que solo actualiza actualizar-datos.ts')
    const secciones = (c: string) => [...c.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim())
    for (const s of secciones(cuerpoAntes).filter((s) => !secciones(ahora.cuerpo).includes(s))) error(pais.pais, `sección eliminada: «${s}»`)
    const retiradas = ((antes.sources ?? []) as Fuente[]).filter((f) => !((fmAhora.sources ?? []) as Fuente[]).some((g) => g.id === f.id))
    if (retiradas.length > MAX_FUENTES_RETIRADAS) error(pais.pais, `se retiran ${retiradas.length} fuentes`)
    const [mas, menos] = git('diff', '--numstat', base, '--', pais.documento).split('\t').map(Number)
    const lineas = antesTexto.split('\n').length
    if ((mas + menos) / (2 * lineas) > MAX_CAMBIO) error(pais.pais, `el cambio afecta a demasiado texto (${mas}+/${menos}− de ${lineas} líneas)`)
    if (!cambiados.includes(pais.notas)) error(pais.pais, 'el documento cambia pero las notas de investigación no')

    const previos = new Set(numerosDePagina(limpiarCuerpo(cuerpoAntes)))
    const nuevos = [...new Set(numerosDePagina(limpiarCuerpo(ahora.cuerpo)))].filter((n) => !previos.has(n))
    for (const n of nuevos.filter((n) => !respaldado(n, lecturas)))
      error(pais.pais, `cifra nueva sin evidencia verificable: «${n}»`)
  }
}

for (const pais of cargarPaises()) estructura(pais)
if (bandera('html')) html()
const base = argumento('base')
if (base) await cambiosDelAgente(base)

fs.mkdirSync(SALIDA, { recursive: true })
const informe = errores.length ? `## Verificación fallida\n\n${errores.map((e) => `- ${e}`).join('\n')}\n` : 'Verificación correcta.\n'
fs.writeFileSync(path.join(SALIDA, 'verificacion.md'), informe)
console.log(informe)
process.exit(errores.length ? 1 : 0)
