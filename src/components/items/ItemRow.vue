<script setup lang="ts">
import { computed } from 'vue'
import type { Item } from '../../types'
import { useI18n } from '../../i18n'
import UiIcon from '../../ui/UiIcon.vue'
import FoodIcon from '../common/FoodIcon.vue'
import { formatQuantity } from '../../utils/formatItem'

const props = defineProps<{ item: Item; categoryName?: string; categoryColor?: string }>()

defineEmits<{
  (e: 'toggle'): void
  (e: 'edit'): void
  (e: 'delete'): void
}>()

const t = useI18n()

const qty = computed(() => formatQuantity(props.item, t.items.units))
const tileStyle = computed(() =>
  props.categoryColor ? { boxShadow: `inset 0 0 0 1.5px ${props.categoryColor}` } : undefined
)
</script>

<template>
  <div class="row" :class="{ done: item.checked }">
    <div class="item">
      <button
        type="button"
        class="check"
        :class="{ checked: item.checked }"
        :aria-label="item.checked ? 'Décocher' : 'Cocher'"
        :aria-checked="item.checked"
        role="checkbox"
        @click="$emit('toggle')"
      >
        <UiIcon name="check" :size="14" />
        <span class="burst" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </span>
      </button>
      <span class="food-tile" :style="tileStyle">
        <FoodIcon :item-name="item.name" :slug="item.icon" :size="22" />
      </span>
      <div class="label" @click="$emit('edit')">
        <span>{{ item.name }}</span>
        <span v-if="qty" class="qty">{{ qty }}</span>
      </div>
      <button
        type="button"
        class="icon-btn sm"
        style="color: var(--ink-4)"
        :aria-label="t.items.delete"
        @click="$emit('delete')"
      >
        <UiIcon name="delete" :size="16" />
      </button>
    </div>
  </div>
</template>
