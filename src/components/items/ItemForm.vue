<script setup lang="ts">
import type { Category, Item, ItemInput } from '../../types'
import ItemFormModal from './ItemFormModal.vue'
import ItemFormFullscreen from './ItemFormFullscreen.vue'

withDefaults(
  defineProps<{
    open: boolean
    item?: Item | null
    categories: Category[]
    mode?: 'modal' | 'fullscreen'
  }>(),
  { mode: 'modal' }
)

const emit = defineEmits<{
  (e: 'submit', input: ItemInput): void
  (e: 'cancel'): void
}>()

function onSubmit(input: ItemInput) {
  emit('submit', input)
}
function onCancel() {
  emit('cancel')
}
</script>

<template>
  <ItemFormModal
    v-if="mode === 'modal'"
    :open="open"
    :item="item"
    :categories="categories"
    @submit="onSubmit"
    @cancel="onCancel"
  />
  <ItemFormFullscreen
    v-else
    :open="open"
    :item="item"
    :categories="categories"
    @submit="onSubmit"
    @cancel="onCancel"
  />
</template>
