<script setup lang="ts">
import { useI18n } from '../../i18n'
import UiIcon from '../../ui/UiIcon.vue'

export type ItemSortKey = 'updated' | 'created' | 'name'
export type ItemGroupKey = 'category' | 'status'

const props = defineProps<{ groupBy: ItemGroupKey; sortBy: ItemSortKey }>()

const emit = defineEmits<{
  (e: 'update:groupBy', v: ItemGroupKey): void
  (e: 'update:sortBy', v: ItemSortKey): void
}>()

const t = useI18n()

function cycleSort() {
  const order: ItemSortKey[] = ['updated', 'created', 'name']
  const next = order[(order.indexOf(props.sortBy) + 1) % order.length]
  emit('update:sortBy', next)
}
</script>

<template>
  <div class="toolbar">
    <div style="display: inline-flex; align-items: center; gap: 6px">
      <div class="seg" role="tablist">
        <button
          type="button"
          :class="{ active: groupBy === 'category' }"
          @click="emit('update:groupBy', 'category')"
        >
          {{ t.items.groupOptions.category }}
        </button>
        <button
          type="button"
          :class="{ active: groupBy === 'status' }"
          @click="emit('update:groupBy', 'status')"
        >
          {{ t.items.groupOptions.status }}
        </button>
      </div>
    </div>
    <button
      type="button"
      class="chip"
      :aria-label="t.items.sortBy"
      :title="`${t.items.sortBy} — ${t.items.sortOptions[sortBy]}`"
      @click="cycleSort"
    >
      <UiIcon name="sort" :size="12" />
      {{ t.items.sortOptions[sortBy] }}
    </button>
  </div>
</template>
