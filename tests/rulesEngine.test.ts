import { describe, it, expect, beforeAll } from 'vitest'
import type { Item, ShoppingList } from '../src/types'
import { ensureRuleDefinitions, findNameConflict } from '../src/rules/engine'

function makeList(rules: Record<string, { enabled: boolean }>): ShoppingList {
  return {
    id: 'list1',
    name: 'Test',
    user: 'u1',
    rules,
    collectionId: 'lists',
    collectionName: 'lists',
  } as unknown as ShoppingList
}

function makeItem(id: string, name: string): Item {
  return {
    id,
    name,
    quantity_value: 1,
    quantity_unit: 'count',
    checked: false,
    list: 'list1',
    user: 'u1',
    collectionId: 'items',
    collectionName: 'items',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  } as unknown as Item
}

beforeAll(async () => {
  await ensureRuleDefinitions()
})

describe('findNameConflict', () => {
  it('returns null when the rule is disabled', async () => {
    const list = makeList({ unique_strict: { enabled: false } })
    const conflict = await findNameConflict(list, 'Pommes', [makeItem('1', 'Pommes')])
    expect(conflict).toBeNull()
  })

  it('flags an exact-match duplicate under unique_strict', async () => {
    const list = makeList({ unique_strict: { enabled: true } })
    const conflict = await findNameConflict(list, 'Pommes', [makeItem('1', 'Pommes')])
    expect(conflict).not.toBeNull()
    expect(conflict!.ruleId).toBe('unique_strict')
  })

  it('unique_strict is case- and accent-sensitive', async () => {
    const list = makeList({ unique_strict: { enabled: true } })
    expect(await findNameConflict(list, 'pommes', [makeItem('1', 'Pommes')])).toBeNull()
    expect(await findNameConflict(list, 'purree', [makeItem('1', 'Purée')])).toBeNull()
  })

  it('unique_fuzzy ignores case and accents', async () => {
    const list = makeList({ unique_fuzzy: { enabled: true } })
    const c1 = await findNameConflict(list, 'pommes', [makeItem('1', 'Pommes')])
    expect(c1?.ruleId).toBe('unique_fuzzy')
    const c2 = await findNameConflict(list, 'puree', [makeItem('1', 'Purée')])
    expect(c2?.ruleId).toBe('unique_fuzzy')
  })
})
