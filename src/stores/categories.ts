import { defineStore } from 'pinia'
import type { Category } from '../types'
import { categoriesRepo, authRepo } from '../data/repositories'
import { createPbCollectionStore } from './createPbCollectionStore'
import { frCompare } from '../utils/compare'

export interface SeedCategoriesOptions {
  /** Default names to create if the collection is empty for this user. */
  defaults: readonly string[]
}

export const useCategoriesStore = defineStore('categories', () => {
  const base = createPbCollectionStore<Category>({
    fetchAll: categoriesRepo.getAll,
    subscribe: categoriesRepo.subscribe,
    compare: (a, b) => frCompare(a.name, b.name),
  })

  async function create(name: string) {
    const user = authRepo.currentUser()
    if (!user) throw new Error('Not authenticated')
    return categoriesRepo.create(name, user.id)
  }

  async function rename(id: string, name: string) {
    return categoriesRepo.rename(id, name)
  }

  async function remove(id: string) {
    return categoriesRepo.removeAndDetachItems(id)
  }

  /**
   * Seed the current user's categories with a default list if they have none.
   * Callers pass the default names in — the store doesn't know about i18n.
   */
  async function seedDefaults({ defaults }: SeedCategoriesOptions) {
    const user = authRepo.currentUser()
    if (!user) return
    const existing = await categoriesRepo.getAll()
    if (existing.length > 0) return
    for (const name of defaults) {
      await categoriesRepo.create(name, user.id)
    }
  }

  return {
    categories: base.records,
    loading: base.loading,
    fetchAll: base.fetchAll,
    subscribe: base.subscribe,
    unsubscribe: base.unsubscribe,
    create,
    rename,
    remove,
    seedDefaults,
  }
})
