<script setup lang="ts">
import type { Item } from '../../types'
import UiIcon from '../../ui/UiIcon.vue'

defineProps<{
  item: Item
  quantityLabel: string
  color?: string
}>()

const emit = defineEmits<{ (e: 'toggle', item: Item, event: MouseEvent): void }>()

function onMouseDown(event: MouseEvent, item: Item) {
  event.preventDefault()
  emit('toggle', item, event)
}
</script>

<template>
  <div
    class="ac-item"
    :class="{ done: item.checked }"
    role="button"
    :aria-pressed="item.checked"
    @mousedown="onMouseDown($event, item)"
  >
    <button
      type="button"
      class="check"
      :class="{ checked: item.checked }"
      tabindex="-1"
      :aria-label="item.checked ? 'Décocher' : 'Cocher'"
      :aria-checked="item.checked"
      role="checkbox"
    >
      <UiIcon name="check" :size="14" />
      <span class="burst" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </span>
    </button>
    <span v-if="color" class="cat-dot" :style="{ background: color }" />
    <span class="ac-label">{{ item.name }}</span>
    <span v-if="quantityLabel" class="ac-qty">{{ quantityLabel }}</span>
  </div>
</template>
