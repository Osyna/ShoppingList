import { onUnmounted, watch, type Ref } from 'vue'

let lockCount = 0
let previousOverflow: string | null = null

function acquire(): void {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount++
}

function release(): void {
  if (lockCount === 0) return
  lockCount--
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow ?? ''
    previousOverflow = null
  }
}

export function useBodyScrollLock(active: Ref<boolean>): void {
  let held = false

  watch(
    active,
    (value) => {
      if (value && !held) {
        acquire()
        held = true
      } else if (!value && held) {
        release()
        held = false
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (held) {
      release()
      held = false
    }
  })
}
