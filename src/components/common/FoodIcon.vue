<script setup lang="ts">
import { computed } from 'vue'
import { getIconEntry, resolveIcon } from '../../utils/foodIconResolver'

const props = withDefaults(
  defineProps<{
    itemName?: string
    slug?: string | null
    size?: number | string
    alt?: string
  }>(),
  { size: 28 }
)

const entry = computed(() => {
  if (props.slug) return getIconEntry(props.slug)
  if (props.itemName) return resolveIcon(props.itemName).entry
  return getIconEntry(null)
})

const sz = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
</script>

<template>
  <img
    class="food-icon"
    :src="entry.url"
    :alt="alt ?? entry.names[0] ?? ''"
    :style="{ width: sz, height: sz }"
    draggable="false"
  />
</template>

<style scoped>
.food-icon {
  display: inline-block;
  object-fit: contain;
  flex-shrink: 0;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
