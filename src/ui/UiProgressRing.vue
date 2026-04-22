<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ value: number; size?: number; stroke?: number }>(),
  { size: 30, stroke: 2.2 }
)

const r = computed(() => (props.size - props.stroke) / 2)
const c = computed(() => 2 * Math.PI * r.value)
const offset = computed(() => c.value - Math.max(0, Math.min(1, props.value)) * c.value)
</script>

<template>
  <svg :width="size" :height="size" style="display: block">
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="r"
      stroke="var(--line-2)"
      :stroke-width="stroke"
      fill="none"
    />
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="r"
      stroke="var(--accent)"
      :stroke-width="stroke"
      fill="none"
      :stroke-dasharray="c"
      :stroke-dashoffset="offset"
      stroke-linecap="round"
      :transform="`rotate(-90 ${size / 2} ${size / 2})`"
      style="transition: stroke-dashoffset 500ms cubic-bezier(0.2, 0.9, 0.3, 1.2)"
    />
  </svg>
</template>
