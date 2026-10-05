// Read and write a country page (frontmatter + markdown body). The `yaml`
// Document API is used instead of gray-matter's dump so that comments,
// quoting style and key order survive every automatic edit: the daily job
// should produce diffs that only touch the values that actually changed.
import fs from 'node:fs'
import { parseDocument, type Document } from 'yaml'

export interface Pagina {
  doc: Document
  cuerpo: string
}

// Windows checkouts may use CRLF; everything downstream assumes LF.
export function aLF(texto: string): string {
  return texto.split('\r\n').join('\n')
}

export function leerPagina(ruta: string): Pagina {
  const m = aLF(fs.readFileSync(ruta, 'utf8')).match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) throw new Error(`${ruta} no tiene frontmatter`)
  return { doc: parseDocument(m[1], { merge: true }), cuerpo: m[2] }
}

export function escribirPagina(ruta: string, p: Pagina): void {
  const fm = p.doc.toString({ lineWidth: 0 }).trimEnd()
  fs.writeFileSync(ruta, `---\n${fm}\n---\n${p.cuerpo}`)
}

// Ids referenced from the body, in order of first appearance.
export function idsCitados(cuerpo: string): string[] {
  return [...new Set([...cuerpo.matchAll(/<Cite id="([^"]+)"\s*\/>/g)].map((m) => m[1]))]
}

export function idsDatos(cuerpo: string): string[] {
  return [...new Set([...cuerpo.matchAll(/<Dato id="([^"]+)"[^>]*\/>/g)].map((m) => m[1]))]
}

// Adds lines under "## Historial de actualizaciones" in the research notes,
// newest first, creating the section at the end of the file if missing.
export function anotarHistorial(rutaNotas: string, lineas: string[]): void {
  if (!lineas.length) return
  let s = aLF(fs.readFileSync(rutaNotas, 'utf8'))
  const cabecera = '## Historial de actualizaciones'
  const intro = 'Cambios hechos por la actualización automática diaria, del más reciente al más antiguo.'
  if (!s.includes(cabecera)) s = `${s.trimEnd()}\n\n${cabecera}\n\n${intro}\n\n`
  const tras = s.indexOf(intro) + intro.length + 1
  // A blank line after the intro keeps the list a proper markdown list.
  const resto = s.slice(tras).replace(/^\n/, '')
  s = `${s.slice(0, tras)}\n${lineas.map((l) => `- ${l}`).join('\n')}\n${resto}`
  fs.writeFileSync(rutaNotas, s)
}
