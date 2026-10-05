// Turns a figure's config into { valor, periodo }. The operations cover
// what the pages actually show: the latest value, a change against an
// earlier observation or a fixed reference period (optionally in real
// terms, deflating both points with a monthly price index), a difference
// in levels, and rolling sums for monthly flows such as home sales.
import type { DatoConfig } from '../lib/config'
import { serieCSV, serieINE } from './fuentes-datos'
import { etiquetaPeriodo, etiquetaRango, mesesDeTrimestre, type Punto } from './periodos'

export interface Resultado {
  valor: number
  periodo: string
}

function redondear(v: number, decimales = 0): number {
  const f = 10 ** decimales
  return Math.round(v * f) / f
}

function enPosicion(serie: Punto[], desplazamiento: number): Punto {
  const p = serie[serie.length - 1 - desplazamiento]
  if (!p) throw new Error(`La serie no tiene ${desplazamiento + 1} observaciones`)
  return p
}

async function nivelReal(p: Punto, deflactor: string): Promise<number> {
  const ipc = await serieINE(deflactor, 400)
  const meses = p.periodo >= 19 && p.periodo <= 22 ? mesesDeTrimestre(p) : [p.periodo]
  const valores = ipc.filter((x) => x.anyo === p.anyo && meses.includes(x.periodo)).map((x) => x.valor)
  // A quarter is only deflated once its three months are published; until
  // then the figure keeps its previous value instead of a partial average.
  if (valores.length !== meses.length) throw new Error(`Deflactor ${deflactor} incompleto para ${p.anyo}-${p.periodo}`)
  return p.valor / (valores.reduce((a, b) => a + b, 0) / valores.length)
}

export async function calcularDato(cfg: DatoConfig): Promise<Resultado> {
  const serie = cfg.origen === 'ine' ? await serieINE(cfg.serie!, 400) : await serieCSV(cfg)
  if (!serie.length) throw new Error('Serie vacía')
  const op = cfg.op ?? 'ultimo'
  const ultimo = enPosicion(serie, 0)
  const etiqueta = (p: Punto) => etiquetaPeriodo(p, cfg.periodo)

  switch (op) {
    case 'ultimo': {
      const p = enPosicion(serie, cfg.desplazamiento ?? 0)
      return { valor: redondear(p.valor, cfg.decimales), periodo: etiqueta(p) }
    }
    case 'variacion': {
      const antes = enPosicion(serie, cfg.desplazamiento ?? 1)
      return { valor: redondear((ultimo.valor / antes.valor - 1) * 100, cfg.decimales), periodo: etiqueta(ultimo) }
    }
    case 'variacion-referencia': {
      const ref = serie.find((p) => p.anyo === cfg.referencia!.anyo && p.periodo === cfg.referencia!.periodo)
      if (!ref) throw new Error('Periodo de referencia no encontrado')
      const [a, b] = cfg.deflactor
        ? [await nivelReal(ultimo, cfg.deflactor.serie), await nivelReal(ref, cfg.deflactor.serie)]
        : [ultimo.valor, ref.valor]
      return { valor: redondear((a / b - 1) * 100, cfg.decimales), periodo: etiqueta(ultimo) }
    }
    case 'diferencia': {
      const antes = enPosicion(serie, cfg.desplazamiento ?? 1)
      return { valor: redondear(ultimo.valor - antes.valor, cfg.decimales), periodo: etiqueta(ultimo) }
    }
    case 'suma':
    case 'variacion-suma': {
      const n = cfg.n ?? 12
      if (serie.length < (op === 'suma' ? n : 2 * n)) throw new Error(`La serie no tiene ${n} observaciones`)
      const tramo = serie.slice(-n)
      const suma = tramo.reduce((a, p) => a + p.valor, 0)
      const periodo = etiquetaRango(tramo[0], tramo[n - 1])
      if (op === 'suma') return { valor: redondear(suma, cfg.decimales), periodo }
      const previa = serie.slice(-2 * n, -n).reduce((a, p) => a + p.valor, 0)
      return { valor: redondear((suma / previa - 1) * 100, cfg.decimales), periodo }
    }
  }
}
