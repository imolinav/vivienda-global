// Figure extraction for the evidence check. A page writes numbers in
// Spanish style (1.234,5); sources may use either style, so every number
// in a quote yields all plausible readings. A page number counts as backed
// when some reading of a quoted number, rounded to the page's decimals,
// equals it.

// Text the check must ignore: components, link targets and heading anchors.
export function limpiarCuerpo(cuerpo: string): string {
  return cuerpo
    .replace(/<(Cite|Dato|Badge)\b[^>]*\/>/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/\{#[^}]*\}/g, ' ')
}

const MESES = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre'

// Numbers stated on the page that need a source. Excluded on purpose:
// years, day numbers in dates ("24 de mayo"), and numbers that are part of
// legal identifiers (Ley 12/2023, art. 18.2, 2.º).
export function numerosDePagina(texto: string): string[] {
  const t = texto
    .replace(new RegExp(`\\b\\d{1,2} de (${MESES})`, 'gi'), ' ')
    .replace(/\b(art(?:ículo)?s?\.?|apartado|disposición)\s+[\d.]+\w*/gi, ' ')
    .replace(/\d+\/\d+/g, ' ')
    .replace(/\d+\.(º|ª)/g, ' ')
  const out: string[] = []
  for (const m of t.matchAll(/(?<![\p{L}\d.,])\d{1,3}(?:\.\d{3})+(?:,\d+)?(?![\d])|(?<![\p{L}\d.,])\d+(?:,\d+)?(?![\d.,]?\d)/gu)) {
    const s = m[0]
    if (/^(19|20)\d{2}$/.test(s)) continue
    out.push(s)
  }
  return out
}

export function valorEspanol(s: string): { valor: number; decimales: number } {
  const [ent, dec = ''] = s.split(',')
  return { valor: Number(`${ent.replaceAll('.', '')}.${dec || '0'}`), decimales: dec.length }
}

// Every reading of every number in a quote: "12.500" may be twelve
// thousand five hundred (Spanish) or twelve and a half (English).
export function lecturasDeCita(cita: string): number[] {
  const out: number[] = []
  for (const m of cita.matchAll(/\d[\d.,]*\d|\d/g)) {
    const s = m[0]
    out.push(Number(s.replaceAll('.', '').replace(',', '.')))
    out.push(Number(s.replaceAll(',', '')))
    out.push(Number(s.replaceAll('.', '').replaceAll(',', '')))
  }
  return out.filter((n) => Number.isFinite(n))
}

export function respaldado(numero: string, lecturas: number[]): boolean {
  const { valor, decimales } = valorEspanol(numero)
  const f = 10 ** decimales
  return lecturas.some((l) => Math.round(l * f) / f === valor || Math.round(Math.abs(l) * f) / f === valor)
}
