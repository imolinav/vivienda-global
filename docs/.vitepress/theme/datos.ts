// Shape of each entry in a country's frontmatter `datos` map and the
// Spanish number formatting shared by Dato.vue (browser) and the
// automation scripts (Node). The scripts in automatizacion/ write `valor`
// and `periodo` every day; the formatting fields are copied from the
// country's *.fuentes.yml so that the page and the config never disagree.
export interface DatoEntry {
  valor: number
  periodo: string
  fuente: string
  unidad?: string
  decimales?: number
  signo?: boolean
}

// U+2212 (true minus) and U+00A0 (no-break space before the unit) follow
// the house style in .claude/skills/investigar-pais/estilo.md.
export function formatDato(d: Pick<DatoEntry, 'valor' | 'unidad' | 'decimales' | 'signo'>): string {
  const decimales = d.decimales ?? 0
  const numero = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
    // 'always' groups four-digit numbers too (2.355), as the style guide asks.
    useGrouping: 'always' as unknown as boolean,
  }).format(Math.abs(d.valor))
  const signo = d.valor < 0 ? '−' : d.signo && d.valor > 0 ? '+' : ''
  return `${signo}${numero}${d.unidad ? ` ${d.unidad}` : ''}`
}
