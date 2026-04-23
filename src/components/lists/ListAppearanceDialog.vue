<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { IconName } from '../../ui/icons'
import type { ShoppingList } from '../../types'
import {
  LIST_ICONS,
  LIST_PALETTE,
  softListColor,
  useListAppearance,
} from '../../composables/useListAppearance'
import UiIcon from '../../ui/UiIcon.vue'

const props = defineProps<{ list: ShoppingList | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const open = computed(() => props.list !== null)

const draftColor = ref<string>(LIST_PALETTE[0])
const draftIcon = ref<IconName>('cart')

watch(
  () => props.list,
  (l) => {
    if (!l) return
    const { appearance } = useListAppearance(l.id)
    draftColor.value = appearance.value.color
    draftIcon.value = appearance.value.icon
  },
  { immediate: true }
)

function apply() {
  if (!props.list) return
  const { setAppearance } = useListAppearance(props.list.id)
  setAppearance({ color: draftColor.value, icon: draftIcon.value })
  emit('close')
}

function cancel() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="list-appearance-backdrop" @click.self="cancel">
      <div
        class="list-appearance-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-appearance-title"
      >
        <h3 id="list-appearance-title" class="list-appearance-title">
          Apparence de la liste
        </h3>

        <div
          class="list-appearance-preview"
          :style="{
            background: softListColor(draftColor, 0.14),
            borderColor: softListColor(draftColor, 0.4),
          }"
        >
          <span
            class="list-appearance-preview-tile"
            :style="{ background: softListColor(draftColor, 0.28), color: draftColor }"
          >
            <UiIcon :name="draftIcon" :size="22" />
          </span>
          <span class="list-appearance-preview-name">{{ list?.name }}</span>
        </div>

        <div class="list-appearance-section-label">Couleur</div>
        <div class="list-appearance-colors">
          <button
            v-for="c in LIST_PALETTE"
            :key="c"
            type="button"
            class="list-color-swatch"
            :class="{ 'is-active': c === draftColor }"
            :style="{ background: c }"
            :aria-label="c"
            :aria-pressed="c === draftColor"
            @click="draftColor = c"
          />
        </div>

        <div class="list-appearance-section-label">Icône</div>
        <div class="list-appearance-icons">
          <button
            v-for="ic in LIST_ICONS"
            :key="ic"
            type="button"
            class="list-icon-swatch"
            :class="{ 'is-active': ic === draftIcon }"
            :style="
              ic === draftIcon
                ? {
                    background: softListColor(draftColor, 0.22),
                    borderColor: softListColor(draftColor, 0.55),
                    color: draftColor,
                  }
                : {}
            "
            :aria-label="ic"
            :aria-pressed="ic === draftIcon"
            @click="draftIcon = ic"
          >
            <UiIcon :name="ic" :size="18" />
          </button>
        </div>

        <div class="list-appearance-actions">
          <button type="button" class="btn btn-secondary" @click="cancel">
            Annuler
          </button>
          <button type="button" class="btn btn-primary" @click="apply">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
