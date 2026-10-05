// Country configuration for the daily update. Each country has a
// investigacion/<region>/<pais>.fuentes.yml next to its research notes;
// this module finds and parses them. There is no per-country code: the
// YAML declares which figures to refresh (`datos`) and what to watch for
// news (`vigilancia`), and the shared adapters in origenes/ and
// vigilantes/ do the work. Adding a country means adding its YAML.
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

export const RAIZ = path.resolve(import.meta.dirname, '../../..')

export interface Formato {
  unidad?: string
  decimales?: number
  signo?: boolean
}

export type Periodo = 'mes' | 'trimestre' | 'semestre' | 'anual' | 'inicio-trimestre' | 'rango-meses'

// One automatically refreshed figure. `fuente` must be an id present in
// the page's `sources`; the remaining keys depend on `origen`.
export interface DatoConfig extends Formato {
  fuente: string
  origen: 'ine' | 'csv'
  periodo: Periodo
  op?: 'ultimo' | 'variacion' | 'variacion-referencia' | 'diferencia' | 'suma' | 'variacion-suma'
  desplazamiento?: number
  n?: number
  // INE
  serie?: string
  referencia?: { anyo: number; periodo: number }
  deflactor?: { serie: string }
  // CSV
  url?: string
  separador?: string
  filtro?: Record<string, string>
  columnas?: { anyo: string; periodo: string; valor: string }
}

export interface Vigilancia {
  boe?: { secciones: string[]; palabras: string[]; excluir?: string[] }
  consolidadas?: { id: string; nombre: string }[]
  series?: { serie: string; nombre: string }[]
  paginas?: { url: string; patron: string; nombre: string; conservarConsulta?: boolean }[]
}

export interface PaisConfig {
  pais: string
  region: string
  documento: string
  notas: string
  datos: Record<string, DatoConfig>
  vigilancia: Vigilancia
  // Absolute path of the YAML itself, filled in by cargarPaises().
  archivo: string
}

export function cargarPaises(soloPais?: string): PaisConfig[] {
  const base = path.join(RAIZ, 'investigacion')
  const paises: PaisConfig[] = []
  for (const region of fs.readdirSync(base)) {
    const dir = path.join(base, region)
    if (!fs.statSync(dir).isDirectory()) continue
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.fuentes.yml'))) {
      const archivo = path.join(dir, f)
      const cfg = parse(fs.readFileSync(archivo, 'utf8'), { merge: true }) as PaisConfig
      if (soloPais && cfg.pais !== soloPais) continue
      paises.push({ ...cfg, datos: cfg.datos ?? {}, vigilancia: cfg.vigilancia ?? {}, archivo })
    }
  }
  return paises
}

export function rutaEstado(p: PaisConfig): string {
  return path.join(RAIZ, 'automatizacion', 'estado', p.region, `${p.pais}.json`)
}

export const SALIDA = path.join(RAIZ, 'automatizacion', 'salida')

export function hoyISO(): string {
  // Dates are recorded in Spanish time: the BOE and most sources publish
  // on that calendar, and the runner itself is on UTC.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date())
}

export function argumento(nombre: string): string | undefined {
  const i = process.argv.indexOf(`--${nombre}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

export function bandera(nombre: string): boolean {
  return process.argv.includes(`--${nombre}`)
}
