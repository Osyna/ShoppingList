import type { Item } from '../../types'
import type { ListRulesMap } from '../../types'
import { normalizeLoose, normalizeStrict } from './normalize'

type NormalizeFn = (s: string) => string

export function findDuplicatesToDelete(items: Item[], fns: NormalizeFn[]): Item[] {
  if (fns.length === 0 || items.length < 2) return []
  const toDeleteIds = new Set<string>()
  for (const fn of fns) {
    const groups = new Map<string, Item[]>()
    for (const it of items) {
      const key = fn(it.name)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(it)
    }
    for (const group of groups.values()) {
      if (group.length < 2) continue
      const sorted = [...group].sort((a, b) => b.created.localeCompare(a.created))
      for (let i = 1; i < sorted.length; i++) toDeleteIds.add(sorted[i].id)
    }
  }
  return items.filter((i) => toDeleteIds.has(i.id))
}

export function computeDuplicatesForNewRules(
  oldRules: ListRulesMap | undefined,
  newRules: ListRulesMap,
  items: Item[]
): Item[] {
  const fns: NormalizeFn[] = []
  if (newRules.unique_strict?.enabled && !oldRules?.unique_strict?.enabled) {
    fns.push(normalizeStrict)
  }
  if (newRules.unique_fuzzy?.enabled && !oldRules?.unique_fuzzy?.enabled) {
    fns.push(normalizeLoose)
  }
  return findDuplicatesToDelete(items, fns)
}
