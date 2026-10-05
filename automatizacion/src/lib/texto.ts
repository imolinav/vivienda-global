// Turns any source URL (HTML page or PDF) into plain text and caches it in
// automatizacion/.cache. The agent reads sources through this module (see
// the CLI at the bottom) and verificar.ts re-reads the same cached text to
// check that every quoted figure really appears in its source, so both
// sides of the evidence check see exactly the same document.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { extractText, getDocumentProxy } from 'unpdf'
import { RAIZ } from './config'
import { descargar } from './http'

const CACHE = path.join(RAIZ, 'automatizacion', '.cache')

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

export function htmlATexto(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d|dd|dt|td|th)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTIDADES[n.toLowerCase()] ?? m)
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
}

export function rutaCache(url: string): string {
  return path.join(CACHE, `${crypto.createHash('sha1').update(url).digest('hex')}.txt`)
}

export async function urlATexto(url: string, { refrescar = false } = {}): Promise<string> {
  const destino = rutaCache(url)
  if (!refrescar && fs.existsSync(destino)) return fs.readFileSync(destino, 'utf8')
  const res = await descargar(url)
  const tipo = res.headers.get('content-type') ?? ''
  const bytes = new Uint8Array(await res.arrayBuffer())
  let texto: string
  if (tipo.includes('pdf') || url.toLowerCase().split('?')[0].endsWith('.pdf')) {
    const pdf = await getDocumentProxy(bytes)
    const { text } = await extractText(pdf, { mergePages: false })
    texto = (text as string[]).map((t, i) => `===== p.${i + 1}\n${t}`).join('\n')
  } else {
    texto = htmlATexto(new TextDecoder('utf-8').decode(bytes))
  }
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(destino, `URL: ${url}\n${texto}`)
  return fs.readFileSync(destino, 'utf8')
}

// Lowercase, no diacritics, single spaces, no soft hyphens: PDF extraction
// and HTML differ in all of these, and none of them changes a figure.
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ­]/g, '')
    .replace(/[\s ]+/g, ' ')
    .toLowerCase()
    .trim()
}

// CLI used by the agent: `npx tsx automatizacion/src/lib/texto.ts <url> [término...]`.
// Prints the cache path (to read with Read/Grep) and, for each term, the
// surrounding text, so a 300-page PDF never has to be dumped whole.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [url, ...terminos] = process.argv.slice(2)
  if (!url) {
    console.error('Uso: npx tsx automatizacion/src/lib/texto.ts <url> [término...]')
    process.exit(1)
  }
  const texto = await urlATexto(url)
  console.log(`Texto guardado en ${path.relative(RAIZ, rutaCache(url))} (${texto.length} caracteres)`)
  for (const t of terminos) {
    const n = normalizar(t)
    const plano = normalizar(texto)
    let i = plano.indexOf(n)
    let vistos = 0
    console.log(`\n### «${t}»`)
    while (i >= 0 && vistos < 10) {
      console.log(`… ${plano.slice(Math.max(0, i - 300), i + n.length + 300)} …\n`)
      i = plano.indexOf(n, i + n.length)
      vistos++
    }
    if (vistos === 0) console.log('(sin coincidencias)')
  }
}
