import { ref } from 'vue'
import type { Item, ListRulesMap } from '../types'

interface Options {
  deleteItem: (id: string) => Promise<void>
  onResolved: (rules: ListRulesMap, removedCount: number) => Promise<void>
}

export function useDuplicateResolution({ deleteItem, onResolved }: Options) {
  const duplicates = ref<Item[]>([])
  const pendingRules = ref<ListRulesMap | null>(null)
  const busy = ref(false)

  function requestResolution(dupes: Item[], rules: ListRulesMap) {
    duplicates.value = dupes
    pendingRules.value = rules
  }

  async function confirm() {
    const dupes = duplicates.value
    const rules = pendingRules.value
    if (!rules || dupes.length === 0) return
    busy.value = true
    const removed = dupes.length
    try {
      await Promise.all(dupes.map((d) => deleteItem(d.id)))
      duplicates.value = []
      pendingRules.value = null
      await onResolved(rules, removed)
    } finally {
      busy.value = false
    }
  }

  function cancel() {
    duplicates.value = []
    pendingRules.value = null
  }

  return { duplicates, pendingRules, busy, requestResolution, confirm, cancel }
}
