// Shape of each entry in a country's frontmatter `sources` list, shared
// by Cite.vue (inline [n] markers) and CountrySources.vue (the numbered
// list at the end). Both derive the number from the entry's position in
// the list and the anchor from its `id`, so they stay in sync without
// any shared state. `id` is optional only to tolerate older entries.
export interface Source {
  id?: string
  title: string
  url: string
  date?: string
}

export function sourceAnchor(id: string): string {
  return `fuente-${id}`
}
