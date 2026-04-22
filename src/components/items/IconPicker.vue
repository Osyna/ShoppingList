<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FOOD_ICON_LIST, type FoodIconEntry } from '../../data/foodIcons'
import { resolveIcon, searchIcons } from '../../utils/foodIconResolver'
import FoodIcon from '../common/FoodIcon.vue'
import UiModal from '../../ui/UiModal.vue'
import UiButton from '../../ui/UiButton.vue'
import UiInput from '../../ui/UiInput.vue'

const props = defineProps<{ itemName?: string }>()

const model = defineModel<string | null>()

const open = ref(false)
const query = ref('')

const autoSlug = computed(() =>
  props.itemName ? resolveIcon(props.itemName).slug : null
)

const effectiveSlug = computed(() => model.value ?? autoSlug.value)
const isAuto = computed(() => !model.value)

const list = computed<readonly FoodIconEntry[]>(() =>
  query.value.trim() ? searchIcons(query.value, 200) : FOOD_ICON_LIST
)

watch(open, (v) => {
  if (v) query.value = ''
})

function pick(slug: string) {
  model.value = slug
  open.value = false
}

function reset() {
  model.value = null
  open.value = false
}
</script>

<template>
  <div class="icon-picker">
    <button type="button" class="icon-picker-trigger" @click="open = true">
      <FoodIcon :slug="effectiveSlug" :size="36" />
      <span class="icon-picker-meta">
        <span class="icon-picker-label">Icône</span>
        <span class="icon-picker-status">
          {{ isAuto ? 'Automatique' : 'Personnalisée' }}
        </span>
      </span>
    </button>

    <UiModal :open="open" @close="open = false">
      <template #header>
        <h2 class="modal-title">Choisir une icône</h2>
        <p class="modal-subtitle">
          Sélectionnez une icône ou laissez la sélection automatique.
        </p>
      </template>

      <div style="display: flex; flex-direction: column; gap: 12px">
        <UiInput v-model="query" placeholder="Rechercher (ex: pomme, lait...)" />
        <div class="icon-grid">
          <button
            v-for="entry in list"
            :key="entry.slug"
            type="button"
            class="icon-grid-cell"
            :class="{ selected: entry.slug === effectiveSlug }"
            :title="entry.names[0]"
            @click="pick(entry.slug)"
          >
            <FoodIcon :slug="entry.slug" :size="32" />
            <span class="icon-grid-label">{{ entry.names[0] }}</span>
          </button>
        </div>
        <p v-if="!list.length" class="muted" style="text-align: center; padding: 16px">
          Aucune icône trouvée.
        </p>
      </div>

      <template #footer>
        <UiButton variant="ghost" @click="reset">Réinitialiser</UiButton>
        <UiButton variant="primary" @click="open = false">Fermer</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.icon-picker-trigger {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--tint-1, rgba(0, 0, 0, 0.03));
  border: 1px solid var(--line-2, rgba(0, 0, 0, 0.08));
  border-radius: 12px;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease;
  font: inherit;
  color: inherit;
}
.icon-picker-trigger:hover {
  background: var(--tint-2, rgba(0, 0, 0, 0.06));
  border-color: var(--ink-4, rgba(0, 0, 0, 0.2));
}
.icon-picker-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}
.icon-picker-label {
  font-size: 12px;
  color: var(--ink-4, rgba(0, 0, 0, 0.55));
}
.icon-picker-status {
  font-size: 14px;
  font-weight: 500;
}
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 8px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 4px;
}
.icon-grid-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
  font: inherit;
  color: inherit;
}
.icon-grid-cell:hover {
  background: var(--tint-1, rgba(0, 0, 0, 0.04));
}
.icon-grid-cell.selected {
  border-color: var(--accent, #4caf50);
  background: var(--accent-tint, rgba(76, 175, 80, 0.08));
}
.icon-grid-label {
  font-size: 11px;
  text-align: center;
  color: var(--ink-3, rgba(0, 0, 0, 0.65));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  line-height: 1.2;
}
</style>
