<script setup lang="ts">
// Inline citation used inside country markdown: <Cite id="ine-ipv" />.
// Looks the id up in frontmatter `sources` and renders its 1-based
// position as a link to the matching entry in CountrySources.vue.
// An unknown id renders a visible "fuente desconocida" marker instead of
// failing silently, so a typo is caught by grepping the build output.
import { computed } from 'vue'
import { useData } from 'vitepress'
import { sourceAnchor, type Source } from './sources'

const props = defineProps<{ id: string }>()
const { frontmatter } = useData()

const index = computed(() =>
  ((frontmatter.value.sources ?? []) as Source[]).findIndex((s) => s.id === props.id),
)
</script>

<template>
  <sup class="cite">
    <a v-if="index >= 0" :href="`#${sourceAnchor(props.id)}`">[{{ index + 1 }}]</a>
    <span v-else class="cite-missing">[fuente desconocida: {{ props.id }}]</span>
  </sup>
</template>

<style scoped>
.cite {
  margin-left: 1px;
  font-size: 0.75em;
}
.cite a {
  text-decoration: none;
}
.cite-missing {
  color: var(--vp-c-danger-1);
  font-weight: 600;
}
</style>
