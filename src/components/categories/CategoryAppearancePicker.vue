<script setup lang="ts">
import { computed } from 'vue'
import UiModal from '../../ui/UiModal.vue'
import UiButton from '../../ui/UiButton.vue'
import UiIcon from '../../ui/UiIcon.vue'
import {
  useCategoryAppearance,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  softColor,
} from '../../composables/useCategoryAppearance'

const props = defineProps<{
  open: boolean
  categoryId: string
  categoryName: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const { appearance, setAppearance } = useCategoryAppearance(props.categoryId)

const activeColor = computed(() => appearance.value.color)
const activeIcon = computed(() => appearance.value.icon)
</script>

<template>
  <UiModal :open="open" size="md" @close="emit('close')">
    <template #header>
      <div class="modal-head-row">
        <div>
          <h2 class="modal-title">Apparence</h2>
          <p class="modal-subtitle">{{ categoryName }}</p>
        </div>
        <div
          class="cat-appearance-btn"
          :style="{ background: softColor(activeColor, 0.18), color: activeColor, cursor: 'default' }"
        >
          <UiIcon :name="activeIcon" :size="20" />
        </div>
      </div>
    </template>

    <div class="appearance-section">
      <div class="appearance-label">Couleur</div>
      <div class="swatch-row">
        <button
          v-for="c in CATEGORY_COLORS"
          :key="c"
          type="button"
          class="swatch"
          :class="{ on: c === activeColor }"
          :style="{ background: c }"
          :aria-label="`Couleur ${c}`"
          @click="setAppearance({ color: c })"
        />
      </div>
    </div>

    <div class="appearance-section">
      <div class="appearance-label">Icône</div>
      <div class="icon-grid">
        <button
          v-for="i in CATEGORY_ICONS"
          :key="i"
          type="button"
          class="icon-cell"
          :class="{ on: i === activeIcon }"
          :style="
            i === activeIcon
              ? { background: activeColor, color: '#fff', borderColor: 'transparent' }
              : { color: activeColor }
          "
          :aria-label="`Icône ${i}`"
          @click="setAppearance({ icon: i })"
        >
          <UiIcon :name="i" :size="20" />
        </button>
      </div>
    </div>

    <template #footer>
      <UiButton variant="primary" block @click="emit('close')">Terminé</UiButton>
    </template>
  </UiModal>
</template>
