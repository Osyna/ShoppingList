<script setup lang="ts">
import { toRef } from 'vue'
import type { Category, Item, ItemInput } from '../../types'
import { useI18n } from '../../i18n'
import { useItemForm } from '../../composables/useItemForm'
import { UiButton } from '../../ui'
import { defineAsyncComponent } from 'vue'
import UiIcon from '../../ui/UiIcon.vue'
import FoodIcon from '../common/FoodIcon.vue'
// See note in ItemFormModal — same lazy reason.
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
  selectedCategoryColor,
  qtyDisplay,
  updatedFormatted,
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

function onBack() {
  if (editing.value && !isNew.value) cancelEditing()
  else emit('cancel')
}

const close = () => emit('cancel')
</script>

<template>
  <Teleport v-if="open" to=".phone">
    <div class="fullscreen-overlay" role="dialog" aria-modal="true">
      <div class="topbar compact-top">
        <button
          class="back-chev"
          :aria-label="editing && !isNew ? t.items.cancel : t.common.back"
          @click="onBack"
        >
          <UiIcon name="back" :size="18" />
        </button>
        <div class="title-inline">
          <h1>{{ editing ? title : 'Détails' }}</h1>
        </div>
        <div style="display: inline-flex; align-items: center">
          <button
            v-if="!editing && item"
            type="button"
            class="icon-btn"
            :aria-label="t.items.editTitle"
            :title="t.items.editTitle"
            @click="startEditing()"
          >
            <UiIcon name="edit" :size="18" />
          </button>
          <button
            v-if="editing"
            type="button"
            class="icon-btn"
            :aria-label="submitLabel"
            :title="submitLabel"
            :style="{ color: 'var(--accent)' }"
            @click="submit"
          >
            <UiIcon name="save" :size="20" />
          </button>
        </div>
      </div>

      <template v-if="!editing && item">
        <div class="detail-hero">
          <FoodIcon
            :item-name="item.name"
            :slug="item.icon"
            :size="56"
            style="margin-bottom: 8px"
          />
          <div class="eyebrow">{{ t.items.title }}</div>
          <h2>{{ item.name }}</h2>
          <div class="detail-meta">
            <span class="cat-dot" :style="{ background: categoryColor }" />
            <span>{{ categoryName }}</span>
            <template v-if="qtyDisplay">
              <span class="muted-2">·</span>
              <span>{{ qtyDisplay }}</span>
            </template>
            <template v-if="item.checked">
              <span class="muted-2">·</span>
              <span style="color: var(--accent-ink); font-weight: 500">
                {{ t.items.statusChecked }}
              </span>
            </template>
          </div>
        </div>

        <div class="fullscreen-body" style="padding: 0">
          <div class="detail-list">
            <div class="detail-row">
              <span class="detail-row-label">{{ t.items.quantity }}</span>
              <span class="detail-row-value" :class="{ muted: !qtyDisplay }">
                {{ qtyDisplay || 'Non spécifiée' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-row-label">{{ t.items.category }}</span>
              <span class="detail-row-value" :class="{ muted: !item.category }">
                {{ categoryName }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-row-label">{{ t.items.notes }}</span>
              <span class="detail-row-value" :class="{ muted: !form.notes }">
                {{ form.notes || 'Aucune note.' }}
              </span>
            </div>
            <div v-if="updatedFormatted" class="detail-row">
              <span class="detail-row-label">Dernière mise à jour</span>
              <span class="detail-row-value">{{ updatedFormatted }}</span>
            </div>
          </div>
        </div>

        <div class="fullscreen-footer">
          <UiButton variant="ghost" @click="close()">{{ t.items.cancel }}</UiButton>
          <UiButton variant="primary" icon="edit" @click="startEditing()">
            {{ t.items.editTitle }}
          </UiButton>
        </div>
      </template>

      <template v-else>
        <form class="edit-form" @submit.prevent="submit">
          <div class="detail-hero editing">
            <div class="eyebrow">{{ t.items.title }}</div>
            <input
              v-model="form.name"
              type="text"
              class="ghost-serif-input"
              required
              :placeholder="t.items.namePlaceholder"
              :aria-label="t.items.name"
            />
            <div v-if="!isNew && item" class="detail-meta" style="margin-top: 10px">
              <span class="cat-dot" :style="{ background: categoryColor }" />
              <span>{{ categoryName }}</span>
            </div>
          </div>

          <div class="detail-list">
            <div class="detail-row editing">
              <label class="detail-row-label">{{ t.items.quantity }}</label>
              <div class="qty-row">
                <input
                  v-model="form.quantityValue"
                  type="number"
                  :min="0"
                  :step="0.1"
                  class="ghost-input"
                  :aria-label="t.items.quantity"
                />
                <div class="picker picker-sm">
                  <select v-model="form.quantityUnit" :aria-label="t.items.unit">
                    <option v-for="opt in unitOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="detail-row editing">
              <label class="detail-row-label">{{ t.items.category }}</label>
              <div class="picker picker-block">
                <span class="cat-dot" :style="{ background: selectedCategoryColor }" />
                <select v-model="form.category" :aria-label="t.items.category">
                  <option
                    v-for="opt in categoryOptions"
                    :key="String(opt.value)"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="detail-row editing">
              <label class="detail-row-label">Icône</label>
              <IconPicker v-model="form.icon" :item-name="form.name" />
            </div>

            <div class="detail-row editing">
              <label class="detail-row-label">{{ t.items.notes }}</label>
              <textarea
                v-model="form.notes"
                class="ghost-textarea"
                rows="3"
                :placeholder="t.items.notesPlaceholder"
                :aria-label="t.items.notes"
              />
            </div>
          </div>
        </form>

        <div class="fullscreen-footer">
          <UiButton variant="ghost" @click="onBack">{{ t.items.cancel }}</UiButton>
          <UiButton variant="primary" icon="save" @click="submit">{{ submitLabel }}</UiButton>
        </div>
      </template>
    </div>
  </Teleport>
</template>
