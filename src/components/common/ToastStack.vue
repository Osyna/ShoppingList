<script setup lang="ts">
import type { Toast } from '../../composables/useToast'

defineProps<{ toasts: Toast[] }>()
</script>

<template>
  <div class="toast" aria-live="polite">
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="['toast-item', t.kind]"
        role="status"
      >
        <span class="toast-dot" />
        <span>{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>
