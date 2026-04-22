<script setup lang="ts">
defineProps<{ label: string; hint?: string; error?: string }>()
</script>

<template>
  <div class="form-field">
    <label class="form-field-label">{{ label }}</label>
    <slot />
    <p v-if="error" class="form-field-error">{{ error }}</p>
    <p v-else-if="hint" class="form-field-hint">{{ hint }}</p>
  </div>
</template>
