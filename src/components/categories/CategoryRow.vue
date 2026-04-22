<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Category } from '../../types'
import { useI18n } from '../../i18n'
import UiInput from '../../ui/UiInput.vue'
import UiButton from '../../ui/UiButton.vue'
import UiIconButton from '../../ui/UiIconButton.vue'
import UiIcon from '../../ui/UiIcon.vue'
import {
  useCategoryAppearance,
  softColor,
} from '../../composables/useCategoryAppearance'
import CategoryAppearancePicker from './CategoryAppearancePicker.vue'

const props = defineProps<{ category: Category; editing: boolean }>()

const emit = defineEmits<{
  (e: 'rename', value: string): void
  (e: 'start-rename'): void
  (e: 'cancel-rename'): void
  (e: 'delete'): void
}>()

const t = useI18n()
const draft = ref(props.category.name)
const pickerOpen = ref(false)
const { appearance } = useCategoryAppearance(props.category.id)

watch(
  () => [props.editing, props.category.name] as const,
  ([editing, name]) => {
    if (editing) draft.value = name
  },
  { immediate: true }
)

function save() {
  const value = draft.value.trim()
  if (!value) {
    emit('cancel-rename')
    return
  }
  emit('rename', value)
}
</script>

<template>
  <div class="rule">
    <button
      type="button"
      class="cat-appearance-btn"
      :style="{
        background: softColor(appearance.color, 0.18),
        color: appearance.color,
      }"
      :aria-label="`Modifier l'apparence de ${category.name}`"
      :title="`Modifier l'apparence`"
      @click.stop="pickerOpen = true"
    >
      <UiIcon :name="appearance.icon" :size="18" />
    </button>

    <template v-if="editing">
      <UiInput
        v-model="draft"
        style="flex: 1"
        @enter="save"
        @keyup.escape="$emit('cancel-rename')"
      />
      <UiButton size="sm" variant="primary" icon="save" @click="save">
        {{ t.common.save }}
      </UiButton>
    </template>
    <template v-else>
      <div class="rule-body">
        <div class="rule-title">{{ category.name }}</div>
      </div>
      <UiIconButton icon="edit" :label="t.categories.rename" small @click="$emit('start-rename')" />
      <UiIconButton icon="delete" tone="danger" :label="t.categories.delete" small @click="$emit('delete')" />
    </template>

    <CategoryAppearancePicker
      :open="pickerOpen"
      :category-id="category.id"
      :category-name="category.name"
      @close="pickerOpen = false"
    />
  </div>
</template>
