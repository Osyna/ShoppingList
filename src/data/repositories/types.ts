/**
 * Realtime subscription envelope — collection-agnostic so repositories
 * can expose an API that doesn't leak PocketBase types to callers.
 */
export type RealtimeAction = 'create' | 'update' | 'delete'

export interface RealtimeEvent<T> {
  action: RealtimeAction
  record: T
}

export type RealtimeHandler<T> = (event: RealtimeEvent<T>) => void

/** Signature every repository's realtime subscribe follows. */
export type Unsubscribe = () => Promise<void> | void
