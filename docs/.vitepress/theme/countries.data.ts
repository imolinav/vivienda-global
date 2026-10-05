import { createContentLoader } from 'vitepress'

export interface CountryEntry {
  title: string
  url: string
  region: string
  summary: string
  lastUpdated: string | null
}

declare const data: CountryEntry[]
export { data }

// Build-time loader: VitePress runs this in Node, serialises the result
// and inlines it wherever `data` is imported (CountryList.vue). It reads
// only frontmatter, so the country index costs nothing at runtime.
// The region is derived from the folder in the URL rather than from
// frontmatter, so a file can never disagree with where it lives.
export default createContentLoader('paises/*/*.md', {
  transform(pages): CountryEntry[] {
    return pages
      .map(({ url, frontmatter }) => ({
        title: String(frontmatter.title ?? url),
        url,
        region: url.split('/')[2],
        summary: String(frontmatter.summary ?? ''),
        // YAML dates arrive as Date objects; normalise to ISO strings.
        lastUpdated: frontmatter.last_updated
          ? new Date(frontmatter.last_updated).toISOString()
          : null,
      }))
      .sort((a, b) => a.title.localeCompare(b.title, 'es'))
  },
})
