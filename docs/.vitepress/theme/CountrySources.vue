<script setup lang="ts">
// Rendered below every doc page through the `doc-after` slot. Sources
// live in frontmatter (not in the markdown body) so that a future
// update script can read and rewrite them without parsing prose.
import { useData } from 'vitepress'

interface Source {
  title: string
  url: string
  date?: string
}

const { frontmatter } = useData()
</script>

<template>
  <section v-if="frontmatter.sources?.length" class="country-sources" aria-labelledby="fuentes">
    <h2 id="fuentes">Fuentes</h2>
    <ul>
      <li v-for="source in frontmatter.sources as Source[]" :key="source.url">
        <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }}</a>
        <span v-if="source.date"> ({{ source.date }})</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.country-sources {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}
.country-sources h2 {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}
.country-sources ul {
  padding-left: 20px;
  list-style: disc;
}
.country-sources li {
  margin: 6px 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
.country-sources a {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}
</style>
