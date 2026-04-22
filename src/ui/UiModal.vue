<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useBodyScrollLock } from '../composables/useBodyScrollLock'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    subtitle?: string
    size?: 'sm' | 'md' | 'lg'
    closeOnBackdrop?: boolean
  }>(),
  { size: 'md', closeOnBackdrop: true }
)

const emit = defineEmits<{ (e: 'close'): void }>()

const dialogRef = ref<HTMLElement | null>(null)
let returnFocus: HTMLElement | null = null

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(',')

function focusableElements(): HTMLElement[] {
  if (!dialogRef.value) return []
  const nodes = dialogRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null
  )
}

function onBackdrop() {
  if (props.closeOnBackdrop) emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !dialogRef.value) return
  const focusables = focusableElements()
  if (focusables.length === 0) {
    event.preventDefault()
    dialogRef.value.focus()
    return
  }
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const active = document.activeElement as HTMLElement | null
  if (event.shiftKey) {
    if (active === first || !dialogRef.value.contains(active)) {
      event.preventDefault()
      last.focus()
    }
  } else {
    if (active === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

useBodyScrollLock(computed(() => props.open))

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocus = (document.activeElement as HTMLElement | null) ?? null
      await nextTick()
      const focusables = focusableElements()
      ;(focusables[0] ?? dialogRef.value)?.focus()
    } else if (returnFocus) {
      returnFocus.focus?.()
      returnFocus = null
    }
  },
  { immediate: true }
)
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-150"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="open" class="modal-overlay" @click.self="onBackdrop">
      <div
        ref="dialogRef"
        class="modal-card"
        :class="size"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <header v-if="title || $slots.header" class="modal-header">
          <slot name="header">
            <h2 class="modal-title">{{ title }}</h2>
            <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
          </slot>
        </header>
        <div class="modal-body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Transition>
</template>
