import { describe, it, expect } from 'vitest'
import {
  frCompare,
  byRecencyDesc,
  byCreatedAsc,
  byCreatedDesc,
} from '../src/utils/compare'

describe('frCompare', () => {
  it('is case-insensitive', () => {
    expect(frCompare('apple', 'Apple')).toBe(0)
  })

  it('ignores French diacritics', () => {
    expect(frCompare('purée', 'puree')).toBe(0)
    expect(frCompare('Éclair', 'eclair')).toBe(0)
  })

  it('orders alphabetically', () => {
    const arr = ['Zèbre', 'apple', 'Éclair']
    arr.sort(frCompare)
    expect(arr).toEqual(['apple', 'Éclair', 'Zèbre'])
  })
})

describe('time-based comparators', () => {
  const items = [
    { id: 'a', created: '2024-01-01', updated: '2024-02-01' },
    { id: 'b', created: '2024-02-01', updated: '2024-01-15' },
    { id: 'c', created: '2023-12-01', updated: '2024-03-01' },
  ]

  it('byRecencyDesc picks most-recently-updated first', () => {
    const sorted = [...items].sort(byRecencyDesc)
    expect(sorted.map((i) => i.id)).toEqual(['c', 'a', 'b'])
  })

  it('byCreatedDesc picks newest-created first', () => {
    const sorted = [...items].sort(byCreatedDesc)
    expect(sorted.map((i) => i.id)).toEqual(['b', 'a', 'c'])
  })

  it('byCreatedAsc picks oldest-created first', () => {
    const sorted = [...items].sort(byCreatedAsc)
    expect(sorted.map((i) => i.id)).toEqual(['c', 'a', 'b'])
  })

  it('tolerates missing timestamps', () => {
    const mixed = [{ id: 'x' }, { id: 'y', created: '2024-01-01' }]
    expect(() => [...mixed].sort(byCreatedAsc)).not.toThrow()
  })
})
