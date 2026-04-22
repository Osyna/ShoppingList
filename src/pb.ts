/**
 * PocketBase client singleton.
 *
 * To add a new collection:
 *   1. Define its shape in `src/types.ts`.
 *   2. Create a store in `src/stores/` using `createPbCollectionStore` for
 *      read + realtime boilerplate; add per-collection mutations alongside.
 *   3. If the backend collection holds list-scoped data, mirror the
 *      subscription pattern in `stores/items.ts` (per-list subscribe).
 *
 * VITE_PB_URL is required at build time — Vite inlines it via import.meta.env.
 * Set it in `.env` (dev) or via `--build-arg VITE_PB_URL=...` (Docker).
 */
import PocketBase, { ClientResponseError } from 'pocketbase'

const pbUrl = import.meta.env.VITE_PB_URL
if (!pbUrl) {
  throw new Error(
    'VITE_PB_URL is not set. Define it in .env or pass --build-arg VITE_PB_URL at build time.'
  )
}

export const pb = new PocketBase(pbUrl)

export function isAbort(err: unknown): boolean {
  if (err instanceof ClientResponseError) return err.isAbort
  if (err instanceof DOMException && err.name === 'AbortError') return true
  return false
}
