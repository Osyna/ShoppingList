import { computed, ref, type WritableComputedRef } from 'vue'
import type { IconName } from '../ui/icons'

export interface ListAppearance {
  icon: IconName
  color: string
}

/** Curated palette — a sage-friendly subset of the category palette, tuned
 *  so every swatch sits comfortably on the cream background without
 *  fighting the app's warm aesthetic. First entry is the neutral default.
 */
export const LIST_PALETTE: readonly string[] = [
  'oklch(0.78 0.02 80)',   // neutral / default
  'oklch(0.72 0.12 140)',  // sage
  'oklch(0.82 0.08 85)',   // butter
  'oklch(0.78 0.10 55)',   // peach
  'oklch(0.68 0.12 10)',   // rose
  'oklch(0.65 0.10 220)',  // sky
  'oklch(0.70 0.11 305)',  // lavender
  'oklch(0.73 0.10 180)',  // teal
] as const

/** Limited icon set suited to "what kind of list is this": groceries,
 *  home, dining, celebrations, etc. Deliberately curated — too many
 *  choices would turn the picker into a food-icon browser. */
export const LIST_ICONS: readonly IconName[] = [
  'cart',
  'shopping-bag',
  'home',
  'utensils',
  'coffee',
  'wine',
  'gift',
  'heart',
  'star',
  'sparkle',
  'leaf',
  'package',
] as const

const DEFAULT_APPEARANCE: ListAppearance = {
  icon: 'cart',
  color: LIST_PALETTE[0],
}

const store = ref<Record<string, ListAppearance>>({})

function storageKey(id: string): string {
  return `shoppinglist.list.${id}.appearance`
}

function ensure(id: string): void {
  if (id in store.value) return
  let next: ListAppearance = { ...DEFAULT_APPEARANCE }
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey(id)) : null
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ListAppearance>
      next = { ...next, ...parsed }
    }
  } catch {
    /* ignore */
  }
  store.value = { ...store.value, [id]: next }
}

function persist(id: string, value: ListAppearance): void {
  store.value = { ...store.value, [id]: value }
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

/** Reactive writable accessor for one list's appearance. */
export function useListAppearance(id: string): {
  appearance: WritableComputedRef<ListAppearance>
  setAppearance: (partial: Partial<ListAppearance>) => void
} {
  ensure(id)
  const appearance = computed<ListAppearance>({
    get: () => store.value[id] ?? DEFAULT_APPEARANCE,
    set: (v) => persist(id, v),
  })
  function setAppearance(partial: Partial<ListAppearance>) {
    appearance.value = { ...appearance.value, ...partial }
  }
  return { appearance, setAppearance }
}

export function getListAppearance(id: string): ListAppearance {
  ensure(id)
  return store.value[id] ?? DEFAULT_APPEARANCE
}

/** Inject an alpha channel into an OKLCH color for soft tinted surfaces. */
export function softListColor(color: string, alpha = 0.18): string {
  const m = color.match(/^oklch\(\s*([^/)]+)\s*\)$/i)
  if (m) return `oklch(${m[1].trim()} / ${alpha})`
  return color
}
