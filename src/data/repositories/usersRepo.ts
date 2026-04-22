import { pb } from '../../pb'
import type { AuthUser } from '../../types'
import { escapeFilterValue } from '../../utils/pbFilter'

/**
 * Directory lookups over the `users` collection.
 *
 * Kept narrow: only reads needed for inviting members. Email is treated
 * case-insensitively — PocketBase stores emails case-preserving but the
 * `~` contains match is the simplest portable way to avoid surprises.
 */
export const usersRepo = {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const normalized = email.trim().toLowerCase()
    if (!normalized) return null
    try {
      return await pb
        .collection('users')
        .getFirstListItem<AuthUser>(`email = "${escapeFilterValue(normalized)}"`)
    } catch {
      return null
    }
  },

  async getByIds(ids: readonly string[]): Promise<AuthUser[]> {
    if (ids.length === 0) return []
    const filter = ids.map((id) => `id = "${escapeFilterValue(id)}"`).join(' || ')
    return pb.collection('users').getFullList<AuthUser>({ filter })
  },
}
