import { ref, type Ref } from 'vue'
import { isAbort } from '../pb'
import type { RealtimeEvent, Unsubscribe } from '../data/repositories'

export interface BaseRecord {
  id: string
}

export interface PbCollectionOptions<T extends BaseRecord> {
  /**
   * Async function that loads the full list. Typically delegates to a repo.
   * Receives the current scope value (or undefined when unscoped).
   */
  fetchAll: (scope?: string) => Promise<T[]>
  /**
   * Subscribes to realtime events and returns an unsubscribe callback.
   * Called with a pre-built handler that mutates the store's records ref.
   * Receives the current scope value (or undefined when unscoped).
   */
  subscribe: (
    handler: (e: RealtimeEvent<T>) => void,
    scope?: string
  ) => Promise<Unsubscribe>
  /** Optional client-side comparator reapplied after every realtime upsert. */
  compare?: (a: T, b: T) => number
  /** Optional predicate: true = apply the event, false = ignore. */
  accepts?: (record: T) => boolean
}

export interface PbCollectionStore<T extends BaseRecord> {
  records: Ref<T[]>
  loading: Ref<boolean>
  /**
   * Fetch + subscribe under a scope (e.g. a list id for items). Safe to call
   * repeatedly with the same scope (no-op) or with a new scope (re-subscribes).
   * Callers that don't need scoping can invoke `fetchAll()` / `subscribe()`
   * as before.
   */
  scopeTo: (scope: string) => Promise<void>
  fetchAll: () => Promise<void>
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  applyEvent: (e: RealtimeEvent<T>) => void
  /** The currently active scope, or null if unscoped. */
  scope: Ref<string | null>
}

/**
 * Shared reactive state for a PocketBase-backed collection.
 *
 * Supports both unscoped (all records) and scoped (records under a parent id)
 * patterns. All wire calls flow through repo-provided closures, so this module
 * never imports `pb` directly.
 */
export function createPbCollectionStore<T extends BaseRecord>(
  opts: PbCollectionOptions<T>
): PbCollectionStore<T> {
  const records = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const scope = ref<string | null>(null)
  let unsubscribe: Unsubscribe | null = null
  let chain: Promise<void> = Promise.resolve()

  const resort = () => {
    if (opts.compare) records.value = [...records.value].sort(opts.compare)
  }

  function applyEvent(e: RealtimeEvent<T>) {
    if (opts.accepts && !opts.accepts(e.record)) return
    const idx = records.value.findIndex((r) => r.id === e.record.id)
    if (e.action === 'create') {
      if (idx === -1) records.value.push(e.record)
    } else if (e.action === 'update') {
      if (idx !== -1) records.value[idx] = e.record
    } else if (e.action === 'delete') {
      if (idx !== -1) records.value.splice(idx, 1)
    }
    resort()
  }

  /** Queue scope changes so rapid navigation never leaves a dangling sub. */
  function enqueue(task: () => Promise<void>): Promise<void> {
    const run = chain.then(task, task)
    chain = run.catch(() => undefined)
    return run
  }

  async function tearDown() {
    if (!unsubscribe) return
    const u = unsubscribe
    unsubscribe = null
    await u()
  }

  async function fetchAll() {
    loading.value = true
    try {
      records.value = await opts.fetchAll(scope.value ?? undefined)
    } catch (err) {
      if (!isAbort(err)) throw err
    } finally {
      loading.value = false
    }
  }

  async function subscribe() {
    if (unsubscribe) return
    unsubscribe = await opts.subscribe(applyEvent, scope.value ?? undefined)
  }

  async function unsubscribeFn() {
    await tearDown()
    scope.value = null
    records.value = []
  }

  async function scopeTo(next: string) {
    return enqueue(async () => {
      if (scope.value === next && unsubscribe) return
      await tearDown()
      scope.value = next
      await fetchAll()
      unsubscribe = await opts.subscribe(applyEvent, next)
    })
  }

  return {
    records,
    loading,
    scope,
    fetchAll,
    subscribe,
    unsubscribe: () => enqueue(unsubscribeFn),
    applyEvent,
    scopeTo,
  }
}
