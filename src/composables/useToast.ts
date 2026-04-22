import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  kind: 'info' | 'success' | 'error'
}

const toasts = ref<Toast[]>([])
let nextId = 1

export function useToast() {
  function push(message: string, kind: Toast['kind'] = 'info', ms = 3000) {
    const id = nextId++
    toasts.value.push({ id, message, kind })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, ms)
  }
  return {
    toasts,
    info: (m: string) => push(m, 'info'),
    success: (m: string) => push(m, 'success'),
    error: (m: string) => push(m, 'error', 4500),
  }
}
