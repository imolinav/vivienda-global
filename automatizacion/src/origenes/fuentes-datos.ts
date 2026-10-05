// Fetches the raw series behind a figure. Two origins exist so far: the
// INE Tempus JSON API (any series code) and plain CSV files published as
// open data (e.g. the Ministry of Housing's appraised values). Both return
// points sorted oldest to newest; calcular.ts applies the operation on top.
import { descargarJSON, descargarTexto } from '../lib/http'
import type { DatoConfig } from '../lib/config'
import type { Punto } from './periodos'

interface SerieINE {
  COD: string
  Data: { Anyo: number; FK_Periodo: number; Valor: number | null }[]
}

const cacheINE = new Map<string, Promise<Punto[]>>()

export function serieINE(codigo: string, n = 400): Promise<Punto[]> {
  const clave = `${codigo}:${n}`
  if (!cacheINE.has(clave)) {
    cacheINE.set(
      clave,
      descargarJSON<SerieINE>(`https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/${codigo}?nult=${n}`).then((s) =>
        s.Data.filter((d) => d.Valor !== null)
          .map((d) => ({ anyo: d.Anyo, periodo: d.FK_Periodo, valor: d.Valor as number }))
          .sort((a, b) => a.anyo - b.anyo || a.periodo - b.periodo),
      ),
    )
  }
  return cacheINE.get(clave)!
}

// Quarterly CSVs number quarters 1-4; they are mapped to INE's 19-22 so the
// same period labels and deflator logic apply.
export async function serieCSV(cfg: DatoConfig): Promise<Punto[]> {
  if (!cfg.url || !cfg.columnas) throw new Error('Origen csv sin url o columnas')
  const texto = (await descargarTexto(cfg.url)).replace(/^﻿/, '')
  const [cabecera, ...filas] = texto.split(/\r?\n/).filter(Boolean)
  const sep = cfg.separador ?? ';'
  const cols = cabecera.split(sep)
  const idx = (c: string) => {
    const i = cols.indexOf(c)
    if (i < 0) throw new Error(`Columna «${c}» no encontrada en ${cfg.url}`)
    return i
  }
  const filtros = Object.entries(cfg.filtro ?? {}).map(([c, v]) => [idx(c), v] as const)
  const [ia, ip, iv] = [idx(cfg.columnas.anyo), idx(cfg.columnas.periodo), idx(cfg.columnas.valor)]
  const puntos = new Map<string, Punto>()
  for (const f of filas) {
    const c = f.split(sep)
    if (!filtros.every(([i, v]) => c[i] === v) || c[iv] === '') continue
    const anyo = Number(c[ia])
    const periodo = cfg.periodo === 'trimestre' ? 18 + Number(c[ip]) : Number(c[ip])
    // The ministry repeats some rows; keeping one per period makes it harmless.
    puntos.set(`${anyo}-${periodo}`, { anyo, periodo, valor: Number(c[iv].replace(',', '.')) })
  }
  return [...puntos.values()].sort((a, b) => a.anyo - b.anyo || a.periodo - b.periodo)
}
