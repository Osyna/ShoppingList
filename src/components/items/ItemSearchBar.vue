<script setup lang="ts">
import { computed, toRef, useTemplateRef } from 'vue'
import type { Item } from '../../types'
import { useI18n } from '../../i18n'
import { useItemSearch } from '../../composables/useItemSearch'
import { formatQuantity } from '../../utils/formatItem'
import UiIcon from '../../ui/UiIcon.vue'
import ItemSearchMatch from './ItemSearchMatch.vue'

const props = defineProps<{
  conflict?: string | null
  canAdd: boolean
  items: Item[]
  colorFor?: (item: Item) => string | undefined
}>()

const model = defineModel<string>({ required: true })

const emit = defineEmits<{
  (e: 'quick-add'): void
  (e: 'toggle', item: Item): void
}>()

const t = useI18n()
const rootEl = useTemplateRef<HTMLElement>('rootEl')
const inputEl = useTemplateRef<HTMLInputElement>('inputEl')

const { focused, trimmed, matches, onFocus } = useItemSearch({
  query: model,
  items: toRef(props, 'items'),
  rootEl,
  inputEl,
})

function onEnter() {
  if (props.canAdd) emit('quick-add')
}

function onAddMouseDown(event: MouseEvent) {
  event.preventDefault()
  if (props.canAdd) emit('quick-add')
}

function onToggle(item: Item) {
  emit('toggle', item)
}

const showAdd = computed(() => !!trimmed.value && props.canAdd)
const showDropdown = computed(() => focused.value && !!trimmed.value)
const formatQty = (it: Item) => formatQuantity(it, t.items.units)
</script>

<template>
  <div ref="rootEl" class="searchwrap">
    <div class="searchbox" :class="{ open: showDropdown }">
      <div class="search">
        <UiIcon name="search" :size="16" />
        <input
          ref="inputEl"
          v-model="model"
          type="search"
          :placeholder="t.items.searchPlaceholder"
          :aria-label="t.items.searchPlaceholder"
          @keyup.enter="onEnter"
          @focus="onFocus"
        />
        <button
          type="button"
          class="add-btn"
          :class="{ visible: showAdd }"
          :aria-label="t.items.quickAdd"
          @mousedown="onAddMouseDown"
        >
          <UiIcon name="plus" :size="14" />
        </button>
      </div>

      <p v-if="conflict" class="search-conflict" role="alert">{{ conflict }}</p>

      <div v-if="showDropdown" class="ac">
        <div class="ac-scroll">
          <div v-if="matches.length === 0" class="ac-empty">
            {{ t.items.noMatches }}
          </div>
          <ItemSearchMatch
            v-for="m in matches"
            :key="m.id"
            :item="m"
            :quantity-label="formatQty(m)"
            :color="colorFor?.(m)"
            @toggle="onToggle"
          />
        </div>
      </div>
    </div>
  </div>
</template>
