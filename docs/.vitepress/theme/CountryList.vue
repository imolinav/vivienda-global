<script setup lang="ts">
// Country index used in docs/paises/index.md. Data comes from the
// build-time loader in countries.data.ts, grouped here by region in
// the order defined in regions.ts. Loader URLs are root-relative, so
// withBase() is needed for the site to work under /<repo>/ on Pages.
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as countries } from './countries.data'
import { REGIONS } from '../regions'
import { formatDate } from './format'

const groups = computed(() =>
  Object.entries(REGIONS)
    .map(([key, label]) => ({ key, label, items: countries.filter((c) => c.region === key) }))
    .filter((group) => group.items.length > 0),
)
</script>

<template>
  <section v-for="group in groups" :key="group.key" class="region">
    <h2 :id="group.key">{{ group.label }}</h2>
    <ul>
      <li v-for="country in group.items" :key="country.url">
        <a :href="withBase(country.url)">{{ country.title }}</a>
        <span v-if="country.summary" class="summary"> — {{ country.summary }}</span>
        <span v-if="country.lastUpdated" class="date">
          Actualizado el {{ formatDate(country.lastUpdated) }}
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.summary {
  color: var(--vp-c-text-2);
}
.date {
  display: block;
  font-size: 13px;
  color: var(--vp-c-text-3);
}
</style>
