import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import CountryList from './CountryList.vue'
import CountryMeta from './CountryMeta.vue'
import CountrySources from './CountrySources.vue'

// Extends the default theme instead of replacing it: the stock layout
// is kept and two of its named slots are filled, so every country page
// gets its metadata line and sources block without any markup in the
// markdown itself. CountryList is registered globally because it is
// used directly inside a .md file (docs/paises/index.md).
export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'doc-before': () => h(CountryMeta),
      'doc-after': () => h(CountrySources),
    }),
  enhanceApp({ app }) {
    app.component('CountryList', CountryList)
  },
} satisfies Theme
