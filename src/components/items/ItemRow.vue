<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Item } from '../../types'
import { useI18n } from '../../i18n'
import UiIcon from '../../ui/UiIcon.vue'
import FoodIcon from '../common/FoodIcon.vue'
import { formatQuantity } from '../../utils/formatItem'
import { openRowId } from '../../composables/useRowSwipe'
import { playCheckSound } from '../../composables/useCheckSound'

const props = defineProps<{ item: Item; categoryName?: string; categoryColor?: string }>()
const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'edit'): void
  (e: 'delete'): void
}>()

const t = useI18n()
const qty = computed(() => formatQuantity(props.item, t.items.units))
const tileStyle = computed(() =>
  props.categoryColor ? { boxShadow: `inset 0 0 0 1.5px ${props.categoryColor}` } : undefined
)

const ACTIONS_WIDTH = 132
const SNAP_THRESHOLD = ACTIONS_WIDTH * 0.4
const TOGGLE_THRESHOLD = 70
const TOGGLE_MAX = 110

const offset = ref(0)
const dragging = ref(false)
const isOpen = computed(() => offset.value <= -SNAP_THRESHOLD)

// While checking (false → true) we hold the toggle for a beat so the user
// gets to see the satisfying check animation + hear the sound BEFORE the
// item disappears into the "done" group. Uncheck stays instant — there's
// no payoff in delaying that.
const CHECK_ANIMATION_MS = 380
const pendingCheck = ref(false)
let pendingTimer: ReturnType<typeof setTimeout> | null = null
// Whatever the row should *render* as checked, regardless of the source of
// truth. Lets the visual flip immediately while the actual emit is delayed.
const displayChecked = computed(() => pendingCheck.value || props.item.checked)

function fireToggle() {
  // Uncheck or already-pending: emit immediately (or ignore double-tap).
  if (props.item.checked) {
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null
      pendingCheck.value = false
    }
    emit('toggle')
    return
  }
  if (pendingCheck.value) return
  pendingCheck.value = true
  playCheckSound()
  pendingTimer = setTimeout(() => {
    pendingTimer = null
    pendingCheck.value = false
    emit('toggle')
  }, CHECK_ANIMATION_MS)
}

onBeforeUnmount(() => {
  if (pendingTimer) clearTimeout(pendingTimer)
})
const direction = computed<'left' | 'right' | null>(() => {
  if (offset.value < -1) return 'left'
  if (offset.value > 1) return 'right'
  return null
})
const willToggle = computed(() => offset.value >= TOGGLE_THRESHOLD)

let startX = 0
let startY = 0
let startOffset = 0
let axis: 'x' | 'y' | null = null
let pointerId: number | null = null
let didSwipe = false

watch(openRowId, (id) => {
  if (id !== props.item.id && !dragging.value && offset.value !== 0) {
    offset.value = 0
  }
})

function snapOpen() {
  offset.value = -ACTIONS_WIDTH
  openRowId.value = props.item.id
}
function snapClosed() {
  offset.value = 0
  if (openRowId.value === props.item.id) openRowId.value = null
}

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  startX = e.clientX
  startY = e.clientY
  startOffset = offset.value
  axis = null
  didSwipe = false
  dragging.value = true
  pointerId = e.pointerId
  ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || pointerId !== e.pointerId) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (!axis) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (axis === 'y') {
      dragging.value = false
      pointerId = null
      ;(e.currentTarget as Element).releasePointerCapture?.(e.pointerId)
      return
    }
  }
  if (axis !== 'x') return
  didSwipe = true
  let next = startOffset + dx
  if (next > TOGGLE_MAX) next = TOGGLE_MAX + (next - TOGGLE_MAX) * 0.18
  if (next < -ACTIONS_WIDTH) next = -ACTIONS_WIDTH + (next + ACTIONS_WIDTH) * 0.25
  offset.value = next
}

function onPointerUp(e: PointerEvent) {
  if (!dragging.value || pointerId !== e.pointerId) return
  dragging.value = false
  pointerId = null
  ;(e.currentTarget as Element).releasePointerCapture?.(e.pointerId)
  if (axis !== 'x') return

  if (offset.value >= TOGGLE_THRESHOLD) {
    snapClosed()
    fireToggle()
    return
  }

  if (offset.value <= -SNAP_THRESHOLD) {
    snapOpen()
  } else {
    snapClosed()
  }
}

// All three zone click handlers share the same swipe/dismiss preamble:
// 1. Suppress the trailing click that the OS fires after a real swipe.
// 2. If the action panel is currently revealed, treat any tap as "dismiss"
//    (tapping the row should not also fire the underlying zone action).
// 3. If a different row is open, close it before acting.
function consumeSwipeOrDismiss(e: MouseEvent): boolean {
  if (didSwipe) {
    didSwipe = false
    e.stopPropagation()
    return true
  }
  if (offset.value < 0) {
    snapClosed()
    return true
  }
  if (openRowId.value && openRowId.value !== props.item.id) {
    openRowId.value = null
  }
  return false
}

function onToggleZone(e: MouseEvent) {
  if (consumeSwipeOrDismiss(e)) return
  fireToggle()
}
function onViewZone(e: MouseEvent) {
  if (consumeSwipeOrDismiss(e)) return
  emit('edit')
}
function onActionsZone(e: MouseEvent) {
  // Actions zone has its own dismiss semantics: clicking it always toggles
  // the panel (open ↔ closed) regardless of which other row was open.
  if (didSwipe) {
    didSwipe = false
    e.stopPropagation()
    return
  }
  if (offset.value <= -SNAP_THRESHOLD) {
    snapClosed()
  } else {
    snapOpen()
  }
}

const itemStyle = computed(() => {
  if (offset.value === 0 && !dragging.value) {
    return { transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)' }
  }
  return {
    transform: `translate3d(${offset.value}px, 0, 0)`,
    transition: dragging.value
      ? 'none'
      : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
  }
})

const toggleHintStyle = computed(() => {
  const ratio = Math.min(1, Math.max(0, offset.value / TOGGLE_THRESHOLD))
  return {
    opacity: String(ratio),
    transform: `scale(${0.7 + ratio * 0.4})`,
  }
})
</script>

<template>
  <div
    class="row"
    :class="{
      done: displayChecked,
      'row-checking': pendingCheck,
      'row-open': isOpen,
      'row-dragging': dragging,
      'row-swipe-left': direction === 'left',
      'row-swipe-right': direction === 'right',
      'row-will-toggle': willToggle,
    }"
  >
    <div class="row-actions" aria-hidden="true">
      <button
        type="button"
        class="row-action row-action-view"
        aria-label="Voir le détail"
        tabindex="-1"
        @click.stop="onViewZone"
      >
        <UiIcon name="eye" :size="18" />
      </button>
      <button
        type="button"
        class="row-action row-action-delete"
        :aria-label="t.items.delete"
        tabindex="-1"
        @click.stop="emit('delete')"
      >
        <UiIcon name="delete" :size="18" />
      </button>
    </div>
    <div class="row-toggle-hint" aria-hidden="true">
      <span class="row-toggle-hint-icon" :style="toggleHintStyle">
        <UiIcon :name="item.checked ? 'close' : 'check'" :size="20" />
      </span>
    </div>
    <div
      class="item"
      :style="itemStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- Visual layer (unchanged) -->
      <span class="check" :class="{ checked: displayChecked }" aria-hidden="true">
        <UiIcon name="check" :size="14" />
        <span class="burst">
          <span /><span /><span /><span /><span />
        </span>
      </span>
      <span class="food-tile" :style="tileStyle">
        <FoodIcon :item-name="item.name" :slug="item.icon" :size="22" />
      </span>
      <div class="label">
        <span>{{ item.name }}</span>
        <span v-if="qty" class="qty">{{ qty }}</span>
      </div>

      <!-- Hitbox layer: transparent buttons over each zone. Bigger than
           the visual elements so taps don't have to be precise; pointer
           events bubble to .item, so swipe gestures keep working. -->
      <button
        type="button"
        class="hit hit-toggle"
        role="checkbox"
        :aria-checked="displayChecked"
        :aria-label="displayChecked ? 'Décocher ' + item.name : 'Cocher ' + item.name"
        @click="onToggleZone"
      />
      <button
        type="button"
        class="hit hit-view"
        aria-label="Voir le détail"
        tabindex="-1"
        @click="onViewZone"
      />
      <button
        type="button"
        class="hit hit-actions"
        aria-label="Afficher les actions"
        tabindex="-1"
        @click="onActionsZone"
      />
    </div>
  </div>
</template>
