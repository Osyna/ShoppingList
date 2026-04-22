import { defineStore } from 'pinia'
import type { ListRulesMap, ShoppingList } from '../types'
import { listsRepo, authRepo, usersRepo } from '../data/repositories'
import { createPbCollectionStore } from './createPbCollectionStore'

export type ShareErrorCode = 'notFound' | 'alreadyMember' | 'isOwner'

export class ShareError extends Error {
  readonly code: ShareErrorCode
  constructor(code: ShareErrorCode) {
    super(code)
    this.name = 'ShareError'
    this.code = code
  }
}

export const useListsStore = defineStore('lists', () => {
  const base = createPbCollectionStore<ShoppingList>({
    fetchAll: listsRepo.getAll,
    subscribe: listsRepo.subscribe,
  })

  async function create(name: string) {
    const user = authRepo.currentUser()
    if (!user) throw new Error('Not authenticated')
    return listsRepo.create(name, user.id)
  }

  async function rename(id: string, name: string) {
    return listsRepo.rename(id, name)
  }

  async function update(id: string, patch: Partial<ShoppingList>) {
    return listsRepo.update(id, patch)
  }

  async function setRules(id: string, rules: ListRulesMap) {
    return listsRepo.setRules(id, rules)
  }

  async function remove(id: string) {
    await listsRepo.remove(id)
  }

  /** Invite a user by email. Throws `ShareError` with a typed code. */
  async function addMemberByEmail(listId: string, email: string): Promise<ShoppingList> {
    const list = await listsRepo.getOne(listId)
    const user = await usersRepo.findByEmail(email)
    if (!user) throw new ShareError('notFound')
    if (user.id === list.user) throw new ShareError('isOwner')
    const existing = list.members ?? []
    if (existing.includes(user.id)) throw new ShareError('alreadyMember')
    return listsRepo.setMembers(listId, [...existing, user.id])
  }

  async function removeMember(listId: string, userId: string): Promise<ShoppingList> {
    const list = await listsRepo.getOne(listId)
    const next = (list.members ?? []).filter((id) => id !== userId)
    return listsRepo.setMembers(listId, next)
  }

  async function listMembers(listId: string) {
    const list = await listsRepo.getOne(listId)
    return usersRepo.getByIds(list.members ?? [])
  }

  return {
    lists: base.records,
    loading: base.loading,
    fetchAll: base.fetchAll,
    subscribe: base.subscribe,
    unsubscribe: base.unsubscribe,
    create,
    rename,
    update,
    setRules,
    remove,
    addMemberByEmail,
    removeMember,
    listMembers,
  }
})
