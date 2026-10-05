<script setup lang="ts">
// Rendered above every doc page through the `doc-before` layout slot
// (wired in theme/index.ts). It only shows on pages whose frontmatter
// has `last_updated`, i.e. country pages, so other pages are untouched.
import { computed } from 'vue'
import { useData } from 'vitepress'
import { REGIONS } from '../regions'
import { formatDate } from './format'

const { frontmatter, page } = useData()

// relativePath looks like "paises/europa/espana.md"; segment 1 is the region.
const region = computed(() => REGIONS[page.value.relativePath.split('/')[1]] ?? null)
</script>

<template>
  <p v-if="frontmatter.last_updated" class="country-meta">
    <span v-if="region">{{ region }} · </span>
    Actualizado el
    <time :datetime="new Date(frontmatter.last_updated).toISOString().slice(0, 10)">
      {{ formatDate(frontmatter.last_updated) }}
    </time>
  </p>
</template>

<style scoped>
.country-meta {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
</style>
