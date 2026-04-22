<script setup lang="ts">
import type { Item } from '../../types'
import ItemRow from './ItemRow.vue'

defineProps<{
  name: string
  items: Item[]
  color?: string
  categoryNameOf: (categoryId: string | undefined) => string | undefined
  colorFor?: (item: Item) => string | undefined
}>()

defineEmits<{
  (e: 'toggle', item: Item): void
  (e: 'edit', item: Item): void
  (e: 'delete', item: Item): void
}>()
</script>

<template>
  <div>
    <div class="section-label">
      <span v-if="color" class="cat-dot" :style="{ background: color }" />
      <span>{{ name }}</span>
      <span class="count">{{ items.length }}</span>
    </div>
    <TransitionGroup name="itemfx" tag="div" class="item-list">
      <ItemRow
        v-for="it in items"
        :key="it.id"
        :item="it"
        :category-name="categoryNameOf(it.category ?? undefined)"
        :category-color="colorFor?.(it)"
        @toggle="$emit('toggle', it)"
        @edit="$emit('edit', it)"
        @delete="$emit('delete', it)"
      />
    </TransitionGroup>
  </div>
</template>
