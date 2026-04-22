import { pb } from '../../pb'
import type { ListRulesMap, ShoppingList } from '../../types'
import type { RealtimeHandler, Unsubscribe } from './types'

const coll = () => pb.collection('lists')

export const listsRepo = {
  async getAll(): Promise<ShoppingList[]> {
    return coll().getFullList<ShoppingList>({ sort: '-created' })
  },

  async getOne(id: string): Promise<ShoppingList> {
    return coll().getOne<ShoppingList>(id)
  },

  async create(name: string, userId: string): Promise<ShoppingList> {
    return coll().create<ShoppingList>({ name, user: userId })
  },

  async rename(id: string, name: string): Promise<ShoppingList> {
    return coll().update<ShoppingList>(id, { name })
  },

  async update(id: string, patch: Partial<ShoppingList>): Promise<ShoppingList> {
    return coll().update<ShoppingList>(id, patch as never)
  },

  async setRules(id: string, rules: ListRulesMap): Promise<ShoppingList> {
    return coll().update<ShoppingList>(id, { rules } as never)
  },

  async setMembers(id: string, members: string[]): Promise<ShoppingList> {
    return coll().update<ShoppingList>(id, { members } as never)
  },

  async remove(id: string): Promise<void> {
    await coll().delete(id)
  },

  async subscribe(handler: RealtimeHandler<ShoppingList>): Promise<Unsubscribe> {
    await coll().subscribe<ShoppingList>('*', (e) =>
      handler({ action: e.action as 'create' | 'update' | 'delete', record: e.record })
    )
    return () => coll().unsubscribe('*')
  },
}
