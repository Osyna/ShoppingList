/**
 * Repository layer — the only modules that may import from `../../pb` or
 * call `pb.collection(...)`. Stores, composables, and views must consume
 * repositories from this barrel instead.
 *
 * To add a new collection:
 *   1. Create a file here exporting a single `fooRepo` const.
 *   2. Re-export it below.
 *   3. Build a Pinia store that consumes it + `createPbCollectionStore`
 *      for read/realtime state if you want reactivity.
 */
export { listsRepo } from './listsRepo'
export { categoriesRepo } from './categoriesRepo'
export { itemsRepo } from './itemsRepo'
export type { ItemCreatePayload } from './itemsRepo'
export { authRepo, AuthError, type AuthErrorCode } from './authRepo'
export { usersRepo } from './usersRepo'
export type { RealtimeEvent, RealtimeHandler, RealtimeAction, Unsubscribe } from './types'
