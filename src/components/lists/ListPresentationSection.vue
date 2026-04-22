<script setup lang="ts">
import type { PresentationMode } from '../../composables/useListPresentation'

defineProps<{
  editMode: PresentationMode
  deleteMode: PresentationMode
  hideChecked: boolean
}>()

const emit = defineEmits<{
  (e: 'update:editMode', v: PresentationMode): void
  (e: 'update:deleteMode', v: PresentationMode): void
  (e: 'update:hideChecked', v: boolean): void
}>()

const presentationModes: { key: PresentationMode; label: string }[] = [
  { key: 'modal', label: 'Modale' },
  { key: 'fullscreen', label: 'Plein écran' },
]
</script>

<template>
  <div class="rule-group">
    <h4>Interface</h4>
    <div class="rule">
      <div class="rule-body">
        <div class="rule-title">Édition d'un article</div>
        <div class="rule-desc">Ouvrir le formulaire d'édition en modale ou en plein écran.</div>
      </div>
      <div class="seg" role="tablist">
        <button
          v-for="m in presentationModes"
          :key="`edit-${m.key}`"
          type="button"
          :class="{ active: editMode === m.key }"
          @click="emit('update:editMode', m.key)"
        >
          {{ m.label }}
        </button>
      </div>
    </div>
    <div class="rule">
      <div class="rule-body">
        <div class="rule-title">Suppression d'un article</div>
        <div class="rule-desc">Afficher la confirmation en modale ou en plein écran.</div>
      </div>
      <div class="seg" role="tablist">
        <button
          v-for="m in presentationModes"
          :key="`delete-${m.key}`"
          type="button"
          :class="{ active: deleteMode === m.key }"
          @click="emit('update:deleteMode', m.key)"
        >
          {{ m.label }}
        </button>
      </div>
    </div>
    <div class="rule">
      <div class="rule-body">
        <div class="rule-title">Masquer les articles cochés</div>
        <div class="rule-desc">
          Retire automatiquement les articles cochés de la liste pour se concentrer sur ce qu'il reste à acheter.
        </div>
      </div>
      <button
        type="button"
        class="switch"
        :class="{ on: hideChecked }"
        role="switch"
        :aria-checked="hideChecked"
        aria-label="Masquer les articles cochés"
        @click="emit('update:hideChecked', !hideChecked)"
      >
        <i />
      </button>
    </div>
  </div>
</template>
