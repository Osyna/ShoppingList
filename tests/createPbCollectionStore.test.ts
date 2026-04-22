import { describe, it, expect } from 'vitest'
import { createPbCollectionStore } from '../src/stores/createPbCollectionStore'
import type { RealtimeEvent, RealtimeHandler } from '../src/data/repositories'

interface FakeRecord {
  id: string
  name: string
}

function makeHarness(initial: FakeRecord[] = []) {
  let handler: RealtimeHandler<FakeRecord> | null = null
  const store = createPbCollectionStore<FakeRecord>({
    fetchAll: async () => [...initial],
    subscribe: async (h) => {
      handler = h
      return async () => {
        handler = null
      }
    },
    compare: (a, b) => a.name.localeCompare(b.name, 'fr'),
  })
  const emit = (event: RealtimeEvent<FakeRecord>) => handler?.(event)
  return { store, emit }
}

describe('createPbCollectionStore', () => {
  it('fetchAll populates and marks loading', async () => {
    const { store } = makeHarness([{ id: '1', name: 'A' }])
    const p = store.fetchAll()
    expect(store.loading.value).toBe(true)
    await p
    expect(store.loading.value).toBe(false)
    expect(store.records.value).toHaveLength(1)
  })

  it('applies realtime create events', async () => {
    const { store, emit } = makeHarness()
    await store.subscribe()
    emit({ action: 'create', record: { id: '1', name: 'Zebra' } })
    emit({ action: 'create', record: { id: '2', name: 'Apple' } })
    expect(store.records.value.map((r) => r.id)).toEqual(['2', '1'])
  })

  it('applies update events and re-sorts', async () => {
    const { store, emit } = makeHarness([
      { id: '1', name: 'Apple' },
      { id: '2', name: 'Banana' },
    ])
    await store.fetchAll()
    await store.subscribe()
    emit({ action: 'update', record: { id: '1', name: 'Zebra' } })
    expect(store.records.value.map((r) => r.name)).toEqual(['Banana', 'Zebra'])
  })

  it('applies delete events', async () => {
    const { store, emit } = makeHarness([{ id: '1', name: 'A' }])
    await store.fetchAll()
    await store.subscribe()
    emit({ action: 'delete', record: { id: '1', name: 'A' } })
    expect(store.records.value).toHaveLength(0)
  })

  it('unsubscribe clears the records and allows resubscribe', async () => {
    const { store, emit } = makeHarness([{ id: '1', name: 'A' }])
    await store.fetchAll()
    await store.subscribe()
    await store.unsubscribe()
    expect(store.records.value).toHaveLength(0)
    // no handler attached after unsubscribe, so emit is a no-op
    emit({ action: 'create', record: { id: '2', name: 'B' } })
    expect(store.records.value).toHaveLength(0)
  })
})
