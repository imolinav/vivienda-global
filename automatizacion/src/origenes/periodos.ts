// Human labels for the reference period of a figure, in the style the
// country pages use ("2.º trimestre de 2026", "agosto de 2026"). INE codes
// periods as FK_Periodo: 1-12 months, 19-22 quarters, 28 the whole year;
// the CSV adapter maps its own columns onto the same codes so both share
// these labels.
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const INICIO_TRIMESTRE = ['1 de enero', '1 de abril', '1 de julio', '1 de octubre']

export interface Punto {
  anyo: number
  periodo: number
  valor: number
}

export function etiquetaPeriodo(p: Punto, tipo: string): string {
  if (p.periodo === 28 || tipo === 'anual') return String(p.anyo)
  if (p.periodo >= 19 && p.periodo <= 22) {
    const q = p.periodo - 18
    return tipo === 'inicio-trimestre' ? `${INICIO_TRIMESTRE[q - 1]} de ${p.anyo}` : `${q}.º trimestre de ${p.anyo}`
  }
  if (p.periodo >= 1 && p.periodo <= 12) return `${MESES[p.periodo - 1]} de ${p.anyo}`
  throw new Error(`Periodo INE desconocido: ${p.periodo}`)
}

export function etiquetaRango(desde: Punto, hasta: Punto): string {
  return `${etiquetaPeriodo(desde, 'mes')} a ${etiquetaPeriodo(hasta, 'mes')}`
}

// Months covered by a quarterly point, used to average a monthly deflator.
export function mesesDeTrimestre(p: Punto): number[] {
  const q = p.periodo - 18
  return [q * 3 - 2, q * 3 - 1, q * 3]
}
