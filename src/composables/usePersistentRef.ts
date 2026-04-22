import { ref, watch, type Ref } from 'vue'

export function usePersistentRef<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[]
): Ref<T> {
  const stored = typeof localStorage !== 'undefined' ? (localStorage.getItem(key) as T | null) : null
  const initial = stored && allowed.includes(stored) ? stored : fallback
  const value = ref(initial) as Ref<T>
  watch(value, (v) => {
    try {
      localStorage.setItem(key, v)
    } catch {
      /* ignore */
    }
  })
  return value
}
