<script setup lang="ts">
import { toRef } from 'vue'
import type { Category, Item, ItemInput } from '../../types'
import { useI18n } from '../../i18n'
import { useItemForm } from '../../composables/useItemForm'
import {
  UiButton,
  UiFormField,
  UiInput,
  UiSelect,
  UiTextarea,
} from '../../ui'
import { defineAsyncComponent } from 'vue'
import UiIcon from '../../ui/UiIcon.vue'
import UiModal from '../../ui/UiModal.vue'
// IconPicker pulls in ~80 SVG URLs + fuzzy resolver — only needed while
// the form is open, so load it async to keep ListDetailView lean.
const IconPicker = defineAsyncComponent(() => import('./IconPicker.vue'))

const props = defineProps<{
  open: boolean
  item?: Item | null
  categories: Category[]
}>()

const emit = defineEmits<{
  (e: 'submit', input: ItemInput): void
  (e: 'cancel'): void
}>()

const t = useI18n()

const {
  form,
  editing,
  isNew,
  title,
  submitLabel,
  unitOptions,
  categoryOptions,
  categoryName,
  categoryColor,
  qtyDisplay,
  buildInput,
  startEditing,
  cancelEditing,
} = useItemForm({
  open: toRef(props, 'open'),
  item: toRef(props, 'item'),
  categories: toRef(props, 'categories'),
})

function submit() {
  const input = buildInput()
  if (input) emit('submit', input)
}

function onCancel() {
  if (isNew.value) emit('cancel')
  else cancelEditing()
}

const close = () => emit('cancel')
</script>

<template>
  <UiModal :open="open" @close="close()">
    <template #header>
      <div class="modal-head-row">
        <div>
          <h2 class="modal-title">
            {{ editing ? title : item?.name ?? title }}
          </h2>
          <p v-if="!editing && item" class="modal-subtitle">
            <span
              class="cat-dot"
              :style="{ background: categoryColor, width: '8px', height: '8px', borderRadius: '2px' }"
            />
            <span>{{ categoryName }}</span>
            <span v-if="qtyDisplay" class="muted-2">·</span>
            <span v-if="qtyDisplay">{{ qtyDisplay }}</span>
          </p>
          <p v-else-if="editing && !isNew" class="modal-subtitle">{{ item?.name }}</p>
        </div>
        <button
          v-if="!editing && item"
          type="button"
          class="icon-btn sm"
          :aria-label="t.items.editTitle"
          :title="t.items.editTitle"
          @click="startEditing()"
        >
          <UiIcon name="edit" :size="16" />
        </button>
      </div>
    </template>

    <template v-if="!editing && item">
      <div class="modal-detail-notes">
        <span class="form-field-label">{{ t.items.notes }}</span>
        <p v-if="form.notes">{{ form.notes }}</p>
        <p v-else class="muted">Aucune note.</p>
      </div>
    </template>

    <form
      v-else
      style="display: flex; flex-direction: column; gap: 12px"
      @submit.prevent="submit"
    >
      <UiFormField :label="t.items.name">
        <UiInput v-model="form.name" required :placeholder="t.items.namePlaceholder" />
      </UiFormField>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
        <UiFormField :label="t.items.quantity">
          <UiInput v-model="form.quantityValue" type="number" :min="0" :step="0.1" required />
        </UiFormField>
        <UiFormField :label="t.items.unit">
          <UiSelect v-model="form.quantityUnit" :options="unitOptions" />
        </UiFormField>
      </div>

      <UiFormField :label="t.items.category">
        <UiSelect v-model="form.category" :options="categoryOptions" />
      </UiFormField>

      <UiFormField label="Icône">
        <IconPicker v-model="form.icon" :item-name="form.name" />
      </UiFormField>

      <UiFormField :label="t.items.notes">
        <UiTextarea v-model="form.notes" :placeholder="t.items.notesPlaceholder" />
      </UiFormField>
    </form>

    <template v-if="!editing && item" #footer>
      <UiButton variant="ghost" @click="close()">{{ t.items.cancel }}</UiButton>
      <UiButton variant="primary" icon="edit" @click="startEditing()">
        {{ t.items.editTitle }}
      </UiButton>
    </template>
    <template v-else #footer>
      <UiButton variant="ghost" @click="onCancel">{{ t.items.cancel }}</UiButton>
      <UiButton variant="primary" @click="submit">{{ submitLabel }}</UiButton>
    </template>
  </UiModal>
</template>
