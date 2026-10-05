const formatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeZone: 'UTC' })

// Frontmatter dates are date-only (YYYY-MM-DD), parsed as UTC midnight.
// Formatting in UTC keeps the day stable for readers west of Greenwich.
export function formatDate(value: string | Date): string {
  return formatter.format(new Date(value))
}
