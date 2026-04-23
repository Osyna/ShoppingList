<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ShoppingList } from '../../types'
import { useI18n } from '../../i18n'
import { useSwipeReveal } from '../../composables/useSwipeReveal'
import { useListAppearance, softListColor } from '../../composables/useListAppearance'
import UiIcon from '../../ui/UiIcon.vue'
import UiInput from '../../ui/UiInput.vue'
import UiButton from '../../ui/UiButton.vue'

const props = defineProps<{ list: ShoppingList; editing: boolean }>()

const emit = defineEmits<{
  (e: 'rename', value: string): void
  (e: 'start-rename'): void
  (e: 'cancel-rename'): void
  (e: 'delete'): void
  (e: 'rules'): void
  (e: 'share'): void
  (e: 'appearance'): void
}>()

const { appearance } = useListAppearance(props.list.id)
const cardStyle = computed(() => ({
  '--list-color': appearance.value.color,
  '--list-color-soft': softListColor(appearance.value.color, 0.14),
  '--list-color-border': softListColor(appearance.value.color, 0.4),
  '--list-color-tile': softListColor(appearance.value.color, 0.22),
}))

const t = useI18n()
const router = useRouter()
const draft = ref(props.list.name)

watch(
  () => [props.editing, props.list.name] as const,
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

function openList() {
  router.push({ name: 'list-detail', params: { id: props.list.id } })
}

// ----- Swipe-to-reveal logic -----

const ACTION_TILE = 54 // px per action tile
const ACTION_COUNT = 5
const PANEL_W = ACTION_TILE * ACTION_COUNT
const OPEN_THRESHOLD = PANEL_W * 0.35
const NAV_THRESHOLD = 56 // right-swipe distance to open the list
const INTENT_LOCK = 8 // px before we commit to horizontal/vertical gesture
const RUBBER_BAND = 24 // px overshoot allowed at edges

const id = toRef(props.list, 'id')
const { isOpen, open: openPanel, close: closePanel } = useSwipeReveal(id)

const dragging = ref(false)
const dragX = ref(0)

let startX = 0
let startY = 0
let tracking = false
let intent: 'horizontal' | 'vertical' | null = null
let activePointerId: number | null = null
let capturedEl: HTMLElement | null = null
let suppressNextClick = false

// When another card takes over, snap closed visually.
watch(isOpen, (v) => {
  if (!v && !dragging.value) dragX.value = 0
})

function onPointerDown(e: PointerEvent) {
  if (props.editing) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  // Ignore taps that originate inside the revealed actions panel.
  const target = e.target as Element | null
  if (target?.closest?.('.swipe-action')) return

  startX = e.clientX
  startY = e.clientY
  tracking = true
  intent = null
  activePointerId = e.pointerId
  dragX.value = isOpen.value ? -PANEL_W : 0
}

function onPointerMove(e: PointerEvent) {
  if (!tracking || e.pointerId !== activePointerId) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY

  if (intent === null) {
    if (Math.abs(dx) < INTENT_LOCK && Math.abs(dy) < INTENT_LOCK) return
    if (Math.abs(dy) > Math.abs(dx)) {
      // Let the page scroll vertically; we're done.
      tracking = false
      intent = 'vertical'
      return
    }
    intent = 'horizontal'
    dragging.value = true
    const el = e.currentTarget as HTMLElement
    try {
      el.setPointerCapture?.(e.pointerId)
      capturedEl = el
    } catch {
      /* ignore */
    }
  }

  const base = isOpen.value ? -PANEL_W : 0
  let next = base + dx
  // Clamp on the reveal side; allow right-swipe to travel freely so the
  // left-to-right open-list gesture registers (with a soft rubber-band past
  // the nav threshold).
  if (next < -PANEL_W - RUBBER_BAND) next = -PANEL_W - RUBBER_BAND
  if (next > NAV_THRESHOLD) {
    const overshoot = next - NAV_THRESHOLD
    next = NAV_THRESHOLD + overshoot * 0.35
  }
  dragX.value = next
  e.preventDefault()
}

function onPointerUp(e: PointerEvent) {
  if (e.pointerId !== activePointerId) return
  const wasDragging = dragging.value
  const finalX = dragX.value
  const wasOpen = isOpen.value

  releasePointer(e)
  tracking = false
  dragging.value = false
  intent = null
  activePointerId = null

  if (!wasDragging) {
    // Treat as a plain tap; fall through to @click.
    return
  }

  // Drag just finished — swallow the trailing click the browser will fire.
  suppressNextClick = true

  if (wasOpen) {
    if (finalX > -PANEL_W + OPEN_THRESHOLD) closePanel()
    else openPanel()
  } else {
    if (finalX <= -OPEN_THRESHOLD) {
      openPanel()
    } else if (finalX >= NAV_THRESHOLD) {
      openList()
    } else {
      closePanel()
    }
  }
  // Snap back to the rest position driven by isOpen.
  dragX.value = 0
}

function onPointerCancel(e: PointerEvent) {
  if (e.pointerId !== activePointerId) return
  releasePointer(e)
  tracking = false
  dragging.value = false
  intent = null
  activePointerId = null
  dragX.value = 0
}

function releasePointer(e: PointerEvent) {
  if (!capturedEl) return
  try {
    capturedEl.releasePointerCapture?.(e.pointerId)
  } catch {
    /* ignore */
  }
  capturedEl = null
}

function onCardClick(e: MouseEvent) {
  if (props.editing) return
  if (suppressNextClick) {
    suppressNextClick = false
    e.preventDefault()
    e.stopPropagation()
    return
  }
  if (isOpen.value) {
    // Tapping the covered portion of an open card closes it, never navigates.
    closePanel()
    e.stopPropagation()
    return
  }
  openList()
}

function runAction(fn: () => void) {
  closePanel()
  fn()
}

function onRootKeyDown(e: KeyboardEvent) {
  if (props.editing) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (isOpen.value) closePanel()
    else openList()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    openPanel()
  } else if (e.key === 'ArrowRight' || e.key === 'Escape') {
    if (isOpen.value) {
      e.preventDefault()
      closePanel()
    }
  }
}

// How far (in px) the panel has been revealed. 0 = hidden, PANEL_W = fully revealed.
const revealPx = computed(() => {
  const tx = dragging.value ? dragX.value : isOpen.value ? -PANEL_W : 0
  return Math.max(0, Math.min(PANEL_W, -tx))
})

// 0 → 1 progress used by styles for fade/scale transitions on the actions.
const panelRevealRatio = computed(() => revealPx.value / PANEL_W)

// The card SURFACE slides left to reveal the fixed actions panel behind
// it. No more opaque panel sliding on top — the solid card naturally
// hides the actions when closed, no stacking tricks needed.
const surfaceOffset = computed(() => {
  if (dragging.value) return `${dragX.value}px`
  return isOpen.value ? `${-PANEL_W}px` : '0px'
})

const updatedMeta = computed(() => {
  const d = new Date(props.list.updated)
  if (Number.isNaN(d.getTime())) return ''
  const diffMin = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000))
  if (diffMin < 60) return `Mis à jour il y a ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `Mis à jour il y a ${diffH} h`
  const diffD = Math.round(diffH / 24)
  return `Mis à jour il y a ${diffD} j`
})
</script>

<template>
  <div
    class="swipe-card"
    :class="{ 'is-open': isOpen, 'is-dragging': dragging, 'is-editing': editing }"
    :data-swipe-card="list.id"
    :style="{
      '--swipe-panel-w': `${PANEL_W}px`,
      '--swipe-reveal': panelRevealRatio,
      '--surface-offset': surfaceOffset,
      ...cardStyle,
    }"
  >
    <div class="swipe-actions" aria-hidden="true">
      <button
        type="button"
        class="swipe-action"
        aria-label="Apparence"
        :tabindex="isOpen ? 0 : -1"
        @click.stop="runAction(() => emit('appearance'))"
      >
        <UiIcon name="sparkle" :size="18" />
      </button>
      <button
        type="button"
        class="swipe-action"
        :aria-label="t.share.title"
        :tabindex="isOpen ? 0 : -1"
        @click.stop="runAction(() => emit('share'))"
      >
        <UiIcon name="share" :size="18" />
      </button>
      <button
        type="button"
        class="swipe-action"
        :aria-label="t.rules.manage"
        :tabindex="isOpen ? 0 : -1"
        @click.stop="runAction(() => emit('rules'))"
      >
        <UiIcon name="settings" :size="18" />
      </button>
      <button
        type="button"
        class="swipe-action"
        :aria-label="t.lists.rename"
        :tabindex="isOpen ? 0 : -1"
        @click.stop="runAction(() => emit('start-rename'))"
      >
        <UiIcon name="edit" :size="18" />
      </button>
      <button
        type="button"
        class="swipe-action swipe-action-danger"
        :aria-label="t.lists.delete"
        :tabindex="isOpen ? 0 : -1"
        @click.stop="runAction(() => emit('delete'))"
      >
        <UiIcon name="delete" :size="18" />
      </button>
    </div>

    <div
      class="list-card swipe-surface"
      :class="{ editing }"
      role="button"
      :aria-label="list.name"
      :aria-expanded="isOpen"
      :tabindex="editing ? -1 : 0"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @click="onCardClick"
      @keydown="onRootKeyDown"
    >
      <template v-if="editing">
        <div class="list-card-inline-edit" @click.stop>
          <UiInput
            v-model="draft"
            :placeholder="list.name"
            @enter="save"
            @keyup.escape="$emit('cancel-rename')"
          />
          <UiButton size="sm" variant="primary" icon="save" @click="save">
            {{ t.common.save }}
          </UiButton>
        </div>
      </template>
      <template v-else>
        <div class="swipe-card-body">
          <span class="list-card-tile" aria-hidden="true">
            <UiIcon :name="appearance.icon" :size="22" />
          </span>
          <div class="swipe-card-text">
            <div class="title">{{ list.name }}</div>
            <div class="meta">{{ updatedMeta }}</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
