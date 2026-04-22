<script setup lang="ts">
import UiIcon from './UiIcon.vue'
import type { IconName } from './icons'

type Tone = 'neutral' | 'brand' | 'danger'

withDefaults(
  defineProps<{ icon: IconName; label: string; tone?: Tone; disabled?: boolean; small?: boolean }>(),
  { tone: 'neutral', small: false }
)
</script>

<template>
  <button
    type="button"
    class="icon-btn"
    :class="{ sm: small }"
    :style="{ color: tone === 'danger' ? 'var(--ink-4)' : tone === 'brand' ? 'var(--accent-ink)' : 'var(--ink-2)' }"
    :disabled="disabled"
    :aria-label="label"
  >
    <UiIcon :name="icon" :size="small ? 16 : 18" />
  </button>
</template>
