// Watchers that detect news for a country, without any AI. Each one
// compares what a source shows today with what the country's state file
// remembers, returns the new items and updates the state in place. Only
// these items ever reach the agent, so on a quiet day nothing is spent.
//
// - boe: titles in the BOE daily summary matching the country's keywords
// - consolidadas: a key law whose consolidated text has a new revision date
// - series: an INE series that published a new period (annual studies)
// - paginas: new links on a publications page matching a pattern
import { hoyISO, type Vigilancia } from '../lib/config'
import { descargarJSON, descargarTexto } from '../lib/http'
import { normalizar } from '../lib/texto'
import { serieINE } from '../origenes/fuentes-datos'

export interface Novedad {
  tipo: 'boe' | 'consolidada' | 'serie' | 'pagina'
  titulo: string
  url: string
  detalle?: string
}

export interface Estado {
  boe?: { ultimaFecha: string }
  consolidadas?: Record<string, string>
  series?: Record<string, string>
  paginas?: Record<string, string[]>
  // Consecutive failures per watcher, so a dead source surfaces as an
  // issue after a few days instead of failing silently forever.
  fallos?: Record<string, number>
}

interface ItemBOE {
  identificador: string
  titulo: string
  url_html?: string
}

function* itemsBOE(nodo: unknown): Generator<ItemBOE> {
  if (Array.isArray(nodo)) for (const n of nodo) yield* itemsBOE(n)
  else if (nodo && typeof nodo === 'object') {
    const o = nodo as Record<string, unknown>
    if (typeof o.identificador === 'string' && typeof o.titulo === 'string') yield o as unknown as ItemBOE
    else for (const v of Object.values(o)) yield* itemsBOE(v)
  }
}

function fechasDesde(ultima: string, hoy: string): string[] {
  const out: string[] = []
  const d = new Date(`${ultima}T12:00:00Z`)
  // A long outage should not trigger a flood; two weeks is plenty of backlog.
  for (let i = 0; i < 14; i++) {
    d.setUTCDate(d.getUTCDate() + 1)
    const iso = d.toISOString().slice(0, 10)
    if (iso > hoy) break
    out.push(iso)
  }
  return out
}

export async function vigilarBOE(cfg: NonNullable<Vigilancia['boe']>, estado: Estado): Promise<Novedad[]> {
  const hoy = hoyISO()
  // First run: start watching from today rather than replaying the past.
  if (!estado.boe) {
    estado.boe = { ultimaFecha: hoy }
    return []
  }
  const ultima = estado.boe.ultimaFecha
  const palabras = cfg.palabras.map(normalizar)
  const excluir = (cfg.excluir ?? []).map(normalizar)
  const novedades: Novedad[] = []
  for (const fecha of fechasDesde(ultima, hoy)) {
    let sumario: { data?: { sumario?: { diario?: unknown[] } } }
    try {
      sumario = await descargarJSON(`https://www.boe.es/datosabiertos/api/boe/sumario/${fecha.replaceAll('-', '')}`)
    } catch (e) {
      // No BOE on Sundays and some holidays: the API answers 404.
      if (String(e).includes('404')) continue
      throw e
    }
    for (const diario of sumario.data?.sumario?.diario ?? []) {
      const secciones = (diario as { seccion?: unknown }).seccion
      for (const s of (Array.isArray(secciones) ? secciones : [secciones]) as { codigo: string }[]) {
        if (!s || !cfg.secciones.includes(String(s.codigo))) continue
        for (const it of itemsBOE(s)) {
          const t = normalizar(it.titulo)
          if (palabras.some((p) => t.includes(p)) && !excluir.some((p) => t.includes(p))) {
            novedades.push({
              tipo: 'boe',
              titulo: it.titulo,
              url: it.url_html ?? `https://www.boe.es/diario_boe/txt.php?id=${it.identificador}`,
              detalle: `${it.identificador}, BOE de ${fecha}`,
            })
          }
        }
      }
    }
    estado.boe = { ultimaFecha: fecha }
  }
  return novedades
}

export async function vigilarConsolidadas(cfg: NonNullable<Vigilancia['consolidadas']>, estado: Estado): Promise<Novedad[]> {
  estado.consolidadas ??= {}
  const novedades: Novedad[] = []
  for (const { id, nombre } of cfg) {
    const url = `https://www.boe.es/buscar/act.php?id=${id}`
    const html = await descargarTexto(url)
    const fecha = html.match(/[ÚU]ltima actualizaci[óo]n publicada el (\d{2}\/\d{2}\/\d{4})/)?.[1]
    if (!fecha) throw new Error(`Sin fecha de actualización en ${url}`)
    const previa = estado.consolidadas[id]
    if (previa && previa !== fecha) {
      novedades.push({ tipo: 'consolidada', titulo: `${nombre}: nueva versión consolidada`, url, detalle: `Antes ${previa}, ahora ${fecha}` })
    }
    estado.consolidadas[id] = fecha
  }
  return novedades
}

export async function vigilarSeries(cfg: NonNullable<Vigilancia['series']>, estado: Estado): Promise<Novedad[]> {
  estado.series ??= {}
  const novedades: Novedad[] = []
  for (const { serie, nombre } of cfg) {
    const puntos = await serieINE(serie, 1)
    const ultimo = puntos[puntos.length - 1]
    const clave = `${ultimo.anyo}-${ultimo.periodo}`
    const previa = estado.series[serie]
    if (previa && previa !== clave) {
      novedades.push({
        tipo: 'serie',
        titulo: `${nombre}: nuevo periodo publicado`,
        url: `https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/${serie}?nult=2`,
        detalle: `Antes ${previa}, ahora ${clave}`,
      })
    }
    estado.series[serie] = clave
  }
  return novedades
}

export async function vigilarPaginas(cfg: NonNullable<Vigilancia['paginas']>, estado: Estado): Promise<Novedad[]> {
  estado.paginas ??= {}
  const novedades: Novedad[] = []
  for (const { url, patron, nombre, conservarConsulta } of cfg) {
    const html = await descargarTexto(url)
    const re = new RegExp(patron)
    // Query strings are dropped by default: some sites append a cache
    // buster (?t=...) that would make every link look new every day.
    const absoluta = (h: string) => {
      const u = new URL(h.replaceAll('&amp;', '&'), url)
      if (!conservarConsulta) u.search = ''
      return u.href
    }
    const enlaces = [...new Set([...html.matchAll(/href="([^"#]+)"/g)].map((m) => absoluta(m[1])))].filter((h) => re.test(h))
    if (!enlaces.length) throw new Error(`Ningún enlace coincide con ${patron} en ${url}`)
    const previos = estado.paginas[url]
    if (previos) {
      for (const h of enlaces.filter((h) => !previos.includes(h))) {
        novedades.push({ tipo: 'pagina', titulo: `${nombre}: nueva publicación`, url: h, detalle: `Detectada en ${url}` })
      }
    }
    estado.paginas[url] = [...new Set([...enlaces, ...(previos ?? [])])].slice(0, 500)
  }
  return novedades
}
