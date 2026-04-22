import { computed, onBeforeUnmount, ref, type Ref } from 'vue'

// Shared state so only one list card can stay open at a time.
const openId = ref<string | null>(null)
let mountedCount = 0
let outsideListener: ((e: PointerEvent) => void) | null = null

function handleOutsidePointerDown(e: PointerEvent) {
  if (openId.value === null) return
  const target = e.target as Element | null
  if (target && target.closest?.('[data-swipe-card]')) return
  openId.value = null
}

function attachOutsideListener() {
  if (outsideListener || typeof window === 'undefined') return
  outsideListener = handleOutsidePointerDown
  window.addEventListener('pointerdown', outsideListener, { capture: true })
}

function detachOutsideListener() {
  if (!outsideListener || typeof window === 'undefined') return
  window.removeEventListener('pointerdown', outsideListener, { capture: true })
  outsideListener = null
}

export function useSwipeReveal(id: Ref<string>) {
  mountedCount++
  attachOutsideListener()

  onBeforeUnmount(() => {
    mountedCount--
    if (mountedCount <= 0) {
      detachOutsideListener()
      openId.value = null
      mountedCount = 0
    }
  })

  const isOpen = computed(() => openId.value === id.value)

  function open() {
    openId.value = id.value
  }
  function close() {
    if (openId.value === id.value) openId.value = null
  }
  function closeAll() {
    openId.value = null
  }

  return { isOpen, open, close, closeAll }
}
