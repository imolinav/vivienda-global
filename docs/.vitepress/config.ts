import { defineConfig } from 'vitepress'
import { buildCountrySidebar } from './sidebar'

// GitHub Pages serves project sites under /<repo>/, user sites under /.
// The deploy workflow passes the right value in BASE_PATH (taken from
// actions/configure-pages), so the repo name is never hardcoded here.
// VitePress requires leading and trailing slashes, hence the normalising.
function resolveBase(): string {
  const trimmed = (process.env.BASE_PATH ?? '').replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

export default defineConfig({
  lang: 'es-ES',
  title: 'Vivienda Global',
  description: 'El estado de la vivienda, país a país.',
  base: resolveBase(),
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: 'Países', link: '/paises/' },
      { text: 'Sobre el proyecto', link: '/sobre' },
    ],

    // One sidebar for the whole /paises/ section, generated from disk.
    sidebar: { '/paises/': buildCountrySidebar() },

    // Client-side index built at compile time; no external service.
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: 'Buscar', buttonAriaLabel: 'Buscar' },
          modal: {
            noResultsText: 'Sin resultados para',
            resetButtonTitle: 'Borrar búsqueda',
            footer: { selectText: 'seleccionar', navigateText: 'navegar', closeText: 'cerrar' },
          },
        },
      },
    },

    // Spanish labels for the default theme's built-in UI strings.
    outline: { label: 'En esta página', level: [2, 3] },
    docFooter: { prev: 'Anterior', next: 'Siguiente' },
    darkModeSwitchLabel: 'Apariencia',
    lightModeSwitchTitle: 'Cambiar a modo claro',
    darkModeSwitchTitle: 'Cambiar a modo oscuro',
    sidebarMenuLabel: 'Menú',
    returnToTopLabel: 'Volver arriba',
    skipToContentLabel: 'Saltar al contenido',
  },
})
