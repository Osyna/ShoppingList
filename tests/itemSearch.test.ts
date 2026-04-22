import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import type { Item } from '../src/types'
import { useItemSearch } from '../src/composables/useItemSearch'

function makeItem(id: string, name: string, checked = false): Item {
  return {
    id,
    name,
    quantity_value: 1,
    quantity_unit: 'count',
    checked,
    list: 'l',
    user: 'u',
    collectionId: 'items',
    collectionName: 'items',
    created: '',
    updated: '',
  } as unknown as Item
}

function harness(items: Item[]) {
  const query = ref('')
  const itemsRef = ref(items)
  const rootEl = ref<HTMLElement | null>(null)
  const inputEl = ref<HTMLInputElement | null>(null)
  return {
    query,
    itemsRef,
    search: useItemSearch({ query, items: itemsRef, rootEl, inputEl }),
  }
}

describe('useItemSearch', () => {
  it('returns no matches for an empty query', () => {
    const { search } = harness([makeItem('1', 'Pommes')])
    expect(search.matches.value).toEqual([])
  })

  it('ranks exact match above prefix above contains', async () => {
    const items = [
      makeItem('1', 'Pomme de terre'),
      makeItem('2', 'Jus de pomme'),
      makeItem('3', 'Pomme'),
    ]
    const { query, search } = harness(items)
    query.value = 'pomme'
    await nextTick()
    const names = search.matches.value.map((i) => i.name)
    expect(names[0]).toBe('Pomme')
    expect(names[1]).toBe('Pomme de terre')
    expect(names[2]).toBe('Jus de pomme')
  })

  it('strips diacritics when matching', async () => {
    const { query, search } = harness([makeItem('1', 'Purée')])
    query.value = 'puree'
    await nextTick()
    expect(search.matches.value).toHaveLength(1)
  })

  it('pushes checked items below unchecked on equal score', async () => {
    const items = [makeItem('1', 'Lait', true), makeItem('2', 'Lait', false)]
    const { query, search } = harness(items)
    query.value = 'lait'
    await nextTick()
    expect(search.matches.value[0].id).toBe('2')
    expect(search.matches.value[1].id).toBe('1')
  })
})
