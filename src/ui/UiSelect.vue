<script setup lang="ts" generic="T extends string | number">
import type { UiSelectOption } from './types'

const props = withDefaults(
  defineProps<{
    modelValue: T | null | undefined
    options: UiSelectOption<T>[]
    placeholder?: string
    disabled?: boolean
    compact?: boolean
  }>(),
  { compact: false }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

function onChange(event: Event) {
  const raw = (event.target as HTMLSelectElement).value
  const hit = props.options.find((o) => String(o.value) === raw)
  if (hit) emit('update:modelValue', hit.value)
}
</script>

<template>
  <select
    :value="modelValue ?? ''"
    :disabled="disabled"
    class="input"
    :style="compact ? { width: 'auto', padding: '6px 30px 6px 10px', fontSize: '13px', minHeight: 'auto' } : {}"
    @change="onChange"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>
