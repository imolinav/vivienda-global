<script setup lang="ts">
// Inline figure kept up to date by the automation: <Dato id="ipv-anual" />
// renders the formatted value and <Dato id="ipv-anual" periodo /> its
// reference period, both read from the frontmatter `datos` map. Prose
// never hardcodes these numbers, so the daily job can change them without
// touching the text. An unknown id renders a visible marker that
// automatizacion/src/verificar.ts looks for in the built HTML.
import { computed } from 'vue'
import { useData } from 'vitepress'
import { formatDato, type DatoEntry } from './datos'

const props = defineProps<{ id: string; periodo?: boolean }>()
const { frontmatter } = useData()

const dato = computed(
  () => ((frontmatter.value.datos ?? {}) as Record<string, DatoEntry>)[props.id],
)
</script>

<template>
  <span v-if="dato" class="dato">{{ props.periodo ? dato.periodo : formatDato(dato) }}</span>
  <span v-else class="dato-missing">[dato desconocido: {{ props.id }}]</span>
</template>

<style scoped>
.dato {
  white-space: nowrap;
}
.dato-missing {
  color: var(--vp-c-danger-1);
  font-weight: 600;
}
</style>
