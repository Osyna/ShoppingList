/**
 * Case-insensitive, diacritics-tolerant French comparator for strings.
 * Use everywhere the app sorts by name — `localeCompare(a, 'fr', { sensitivity: 'base' })`
 * duplicated in many places collapses into `frCompare(a, b)`.
 */
export function frCompare(a: string, b: string): number {
  return a.localeCompare(b, 'fr', { sensitivity: 'base' })
}

type Timestamped = { created?: string; updated?: string; [key: string]: unknown }

/** Descending `updated` comparator (more recent first). */
export function byRecencyDesc<T extends Timestamped>(a: T, b: T): number {
  return (b.updated ?? '').localeCompare(a.updated ?? '')
}

/** Ascending `created` comparator (oldest first). */
export function byCreatedAsc<T extends Timestamped>(a: T, b: T): number {
  return (a.created ?? '').localeCompare(b.created ?? '')
}

/** Descending `created` comparator (newest first). */
export function byCreatedDesc<T extends Timestamped>(a: T, b: T): number {
  return (b.created ?? '').localeCompare(a.created ?? '')
}
