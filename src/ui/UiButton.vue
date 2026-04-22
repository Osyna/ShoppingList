<script setup lang="ts">
import { computed } from 'vue'
import UiIcon from './UiIcon.vue'
import type { IconName } from './icons'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    block?: boolean
    icon?: IconName
  }>(),
  { variant: 'primary', size: 'md', type: 'button' }
)

const classes = computed(() =>
  [
    'btn',
    `btn-${props.variant}`,
    props.size === 'sm' ? 'btn-sm' : '',
    props.block ? 'btn-block' : '',
  ]
    .filter(Boolean)
    .join(' ')
)
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading">
    <UiIcon v-if="icon" :name="icon" :size="size === 'sm' ? 14 : 16" />
    <slot />
  </button>
</template>
