<script setup lang="ts">
defineProps<{ title: string; tagline?: string }>()
</script>

<template>
  <div class="auth-shell">
    <h1 class="auth-wordmark">{{ title }}</h1>
    <p v-if="tagline" class="auth-tagline">{{ tagline }}</p>
    <slot />
  </div>
</template>
