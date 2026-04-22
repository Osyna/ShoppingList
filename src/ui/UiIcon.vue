<script setup lang="ts">
import { computed } from 'vue'
import { iconFor, type IconName } from './icons'

const props = withDefaults(
  defineProps<{ name: IconName; label?: string; size?: number | string }>(),
  { size: 18 }
)

const def = computed(() => iconFor(props.name))
const sz = computed(() => String(props.size))
</script>

<template>
  <svg
    :width="sz"
    :height="sz"
    viewBox="0 0 24 24"
    :fill="def.fill ? 'currentColor' : 'none'"
    :stroke="def.stroke ? 'currentColor' : 'none'"
    :stroke-width="def.strokeWidth ?? 1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-label="label"
    :aria-hidden="label ? undefined : true"
    :role="label ? 'img' : undefined"
    v-html="def.content"
  />
</template>
