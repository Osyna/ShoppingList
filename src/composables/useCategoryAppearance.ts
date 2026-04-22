import { computed, ref, type WritableComputedRef } from 'vue'
import type { IconName } from '../ui/icons'
import { categoryPalette, categoryPaletteNeutral } from '../design/tokens'

export interface CategoryAppearance {
  icon: IconName
  color: string
}

/** Re-export for callers that previously read this constant directly. */
export const CATEGORY_COLORS: readonly string[] = categoryPalette

export const CATEGORY_ICONS: IconName[] = [
  'tag',
  'apple',
  'carrot',
  'wheat',
  'milk',
  'egg',
  'fish',
  'coffee',
  'wine',
  'cake',
  'cookie',
  'leaf',
  'pill',
  'gift',
  'heart',
  'star',
  'package',
  'home',
  'shopping-bag',
  'utensils',
  'sparkle',
  'flame',
  'droplet',
  'ice-cream',
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function defaultAppearanceFor(id: string): CategoryAppearance {
  return {
    icon: 'tag',
    color: categoryPalette[hashStr(id) % categoryPalette.length],
  }
}

/** Inject an alpha channel into an OKLCH color string (for soft backgrounds). */
export function softColor(color: string, alpha = 0.18): string {
  const m = color.match(/^oklch\(\s*([^/)]+)\s*\)$/i)
  if (m) return `oklch(${m[1].trim()} / ${alpha})`
  return color
}

const store = ref<Record<string, CategoryAppearance>>({})

function storageKey(id: string): string {
  return `shoppinglist.category.${id}.appearance`
}

function ensure(id: string): void {
  if (id in store.value) return
  let next = defaultAppearanceFor(id)
  try {
    const raw = localStorage.getItem(storageKey(id))
    if (raw) next = { ...next, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  store.value = { ...store.value, [id]: next }
}

function persist(id: string, value: CategoryAppearance): void {
  store.value = { ...store.value, [id]: value }
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

/** Reactive writable accessor for one category's appearance, keyed by id. */
export function useCategoryAppearance(id: string): {
  appearance: WritableComputedRef<CategoryAppearance>
  setAppearance: (partial: Partial<CategoryAppearance>) => void
} {
  ensure(id)
  const appearance = computed({
    get: () => store.value[id] ?? defaultAppearanceFor(id),
    set: (value: CategoryAppearance) => persist(id, value),
  })
  function setAppearance(partial: Partial<CategoryAppearance>) {
    appearance.value = { ...appearance.value, ...partial }
  }
  return { appearance, setAppearance }
}

/** Non-ref getter (still reactive when read from within a computed). */
export function getCategoryAppearance(id: string | undefined): CategoryAppearance {
  if (!id) return { icon: 'tag', color: categoryPaletteNeutral }
  ensure(id)
  return store.value[id]!
}
