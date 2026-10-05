import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Cite from './Cite.vue'
import Dato from './Dato.vue'
import CountryList from './CountryList.vue'
import CountryMeta from './CountryMeta.vue'
import CountrySources from './CountrySources.vue'

// Extends the default theme instead of replacing it: the stock layout
// is kept and two of its named slots are filled, so every country page
// gets its metadata line and sources block without any markup in the
// markdown itself. CountryList, Cite and Dato are registered globally
// because they are used directly inside .md files (the country index and
// every country page respectively).
export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'doc-before': () => h(CountryMeta),
      'doc-after': () => h(CountrySources),
    }),
  enhanceApp({ app }) {
    app.component('Cite', Cite)
    app.component('Dato', Dato)
    app.component('CountryList', CountryList)
  },
} satisfies Theme
