<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Item } from '../../types'
import ItemRow from './ItemRow.vue'
import UiIcon from '../../ui/UiIcon.vue'

const props = defineProps<{
  name: string
  items: Item[]
  color?: string
  groupKey?: string
  listId?: string
  categoryNameOf: (categoryId: string | undefined) => string | undefined
  colorFor?: (item: Item) => string | undefined
}>()

defineEmits<{
  (e: 'toggle', item: Item): void
  (e: 'edit', item: Item): void
  (e: 'delete', item: Item): void
}>()

// Auto-collapse the "checked / done" group when it's large: those rows are
// rarely interacted with, and rendering 200+ ItemRows forces TransitionGroup
// to run FLIP over every node on each toggle. Persisting the state per list
// means the choice sticks between sessions but doesn't leak across lists.
const storageKey = computed(() =>
  props.listId && props.groupKey
    ? `shoppinglist.group.collapsed.${props.listId}.${props.groupKey}`
    : null
)

function initialCollapsed(): boolean {
  const k = storageKey.value
  if (k && typeof localStorage !== 'undefined') {
    const v = localStorage.getItem(k)
    if (v === '1') return true
    if (v === '0') return false
  }
  // No preference yet: collapse the large checked group by default.
  return props.groupKey === '__checked__' && props.items.length > 12
}

const collapsed = ref(initialCollapsed())

watch(
  () => props.items.length,
  () => {
    // If the user hasn't touched the group and it grew past the threshold,
    // re-evaluate the default. Once they toggle manually, their preference
    // is written to localStorage and this branch is skipped.
    const k = storageKey.value
    if (k && typeof localStorage !== 'undefined' && localStorage.getItem(k) === null) {
      collapsed.value = props.groupKey === '__checked__' && props.items.length > 12
    }
  }
)

function toggleCollapsed() {
  collapsed.value = !collapsed.value
  const k = storageKey.value
  if (k && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(k, collapsed.value ? '1' : '0')
    } catch {
      /* ignore */
    }
  }
}
</script>

<template>
  <div>
    <button
      type="button"
      class="section-label section-label-btn"
      :aria-expanded="!collapsed"
      @click="toggleCollapsed"
    >
      <span v-if="color" class="cat-dot" :style="{ background: color }" />
      <span>{{ name }}</span>
      <span class="count">{{ items.length }}</span>
      <span class="section-chevron" :class="{ open: !collapsed }" aria-hidden="true">
        <UiIcon name="chevron" :size="14" />
      </span>
    </button>
    <TransitionGroup v-if="!collapsed" name="itemfx" tag="div" class="item-list">
      <ItemRow
        v-for="it in items"
        :key="it.id"
        v-memo="[it.checked, it.name, it.icon, it.category, it.quantity_value, it.quantity_unit]"
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
