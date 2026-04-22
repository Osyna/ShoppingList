import { pb } from '../../pb'
import type { Category } from '../../types'
import { escapeFilterValue } from '../../utils/pbFilter'
import type { RealtimeHandler, Unsubscribe } from './types'

const coll = () => pb.collection('categories')
const itemsColl = () => pb.collection('items')

export const categoriesRepo = {
  async getAll(): Promise<Category[]> {
    return coll().getFullList<Category>({ sort: 'name' })
  },

  async create(name: string, userId: string): Promise<Category> {
    return coll().create<Category>({ name, user: userId })
  },

  async rename(id: string, name: string): Promise<Category> {
    return coll().update<Category>(id, { name })
  },

  /**
   * Detach items before removing the category: PocketBase does not cascade
   * here and we want items to remain (uncategorized) rather than break.
   */
  async removeAndDetachItems(id: string): Promise<void> {
    const items = await itemsColl().getFullList<{ id: string }>({
      filter: `category = "${escapeFilterValue(id)}"`,
    })
    await Promise.all(items.map((it) => itemsColl().update(it.id, { category: null })))
    await coll().delete(id)
  },

  async subscribe(handler: RealtimeHandler<Category>): Promise<Unsubscribe> {
    await coll().subscribe<Category>('*', (e) =>
      handler({ action: e.action as 'create' | 'update' | 'delete', record: e.record })
    )
    return () => coll().unsubscribe('*')
  },
}
