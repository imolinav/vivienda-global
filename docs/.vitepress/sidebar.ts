import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { DefaultTheme } from 'vitepress'
import { REGIONS } from './regions'

const COUNTRIES_DIR = path.resolve(__dirname, '../paises')

// Builds the sidebar from the filesystem so that dropping a new
// docs/paises/<region>/<country>.md is enough to get it listed.
// Runs once when config.ts is loaded, which means the dev server has
// to be restarted to pick up a newly created file (edits to existing
// files hot-reload as usual). Labels come from each file's frontmatter
// `title`, falling back to the file name.
export function buildCountrySidebar(): DefaultTheme.SidebarItem[] {
  return Object.entries(REGIONS)
    .map(([folder, label]) => {
      const dir = path.join(COUNTRIES_DIR, folder)
      if (!fs.existsSync(dir)) return null

      const items = fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.md') && file !== 'index.md')
        .map((file) => {
          const slug = file.replace(/\.md$/, '')
          const { data } = matter(fs.readFileSync(path.join(dir, file), 'utf8'))
          return { text: String(data.title ?? slug), link: `/paises/${folder}/${slug}` }
        })
        .sort((a, b) => a.text.localeCompare(b.text, 'es'))

      // Empty regions are dropped so the sidebar only shows what exists.
      return items.length ? { text: label, collapsed: false, items } : null
    })
    .filter((group): group is NonNullable<typeof group> => group !== null)
}
