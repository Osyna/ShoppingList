import { defineStore } from 'pinia'
import { isAbort } from '../pb'
import type { Item, ShoppingList, ItemInput } from '../types'
import { runHooks } from '../rules/engine'
import {
  itemsRepo,
  authRepo,
  type ItemCreatePayload,
} from '../data/repositories'
import { createPbCollectionStore } from './createPbCollectionStore'

export const useItemsStore = defineStore('items', () => {
  const base = createPbCollectionStore<Item>({
    fetchAll: (scope) => (scope ? itemsRepo.getForList(scope) : Promise.resolve([])),
    subscribe: (handler, scope) =>
      scope
        ? itemsRepo.subscribeForList(scope, handler)
        : Promise.resolve(() => undefined),
  })

  async function fetchForList(listId: string) {
    await base.scopeTo(listId)
  }

  async function subscribe(listId: string) {
    await base.scopeTo(listId)
  }

  async function unsubscribe() {
    await base.unsubscribe()
  }

  async function create(list: ShoppingList, input: ItemInput) {
    const user = authRepo.currentUser()
    if (!user) throw new Error('Not authenticated')
    await runHooks('beforeItemCreate', list, {
      list,
      input,
      existingItems: base.records.value,
    })
    const now = new Date().toISOString()
    const stub = {
      id: `__pending_${Math.random().toString(36).slice(2)}`,
      collectionId: '',
      collectionName: 'items',
      name: input.name,
      quantity_value: input.quantity_value,
      quantity_unit: input.quantity_unit,
      notes: input.notes ?? '',
      category: input.category || undefined,
      icon: input.icon || undefined,
      list: list.id,
      user: user.id,
      checked: false,
      created: now,
      updated: now,
    } as unknown as Item
    base.records.value.push(stub)
    try {
      const payload: ItemCreatePayload = {
        name: input.name,
        quantity_value: input.quantity_value,
        quantity_unit: input.quantity_unit,
        notes: input.notes ?? '',
        category: input.category || null,
        icon: input.icon || null,
        list: list.id,
        user: user.id,
        checked: false,
      }
      const created = await itemsRepo.create(payload)
      const idx = base.records.value.findIndex((i) => i.id === stub.id)
      if (idx !== -1) {
        if (base.records.value.some((i) => i.id === created.id)) {
          base.records.value.splice(idx, 1)
        } else {
          base.records.value[idx] = created
        }
      }
      return created
    } catch (err) {
      const idx = base.records.value.findIndex((i) => i.id === stub.id)
      if (idx !== -1) base.records.value.splice(idx, 1)
      throw err
    }
  }

  async function update(list: ShoppingList, id: string, patch: Partial<Item>) {
    const idx = base.records.value.findIndex((i) => i.id === id)
    const item = idx !== -1 ? base.records.value[idx] : undefined
    if (item) {
      await runHooks('beforeItemUpdate', list, {
        list,
        item,
        patch,
        existingItems: base.records.value,
      })
      base.records.value[idx] = { ...item, ...patch } as Item
    }
    try {
      const updated = await itemsRepo.update(id, patch)
      const after = base.records.value.findIndex((i) => i.id === id)
      if (after !== -1) base.records.value[after] = updated
      return updated
    } catch (err) {
      if (item && idx !== -1) base.records.value[idx] = item
      throw err
    }
  }

  async function toggle(id: string) {
    const idx = base.records.value.findIndex((i) => i.id === id)
    if (idx === -1) return
    const before = base.records.value[idx]
    const next = !before.checked
    base.records.value[idx] = { ...before, checked: next } as Item
    try {
      const updated = await itemsRepo.updateCoalesced(
        id,
        { checked: next },
        `toggle-${id}-${next}`
      )
      const after = base.records.value.findIndex((i) => i.id === id)
      if (after !== -1) base.records.value[after] = updated
    } catch (err) {
      if (isAbort(err)) return
      const rollbackIdx = base.records.value.findIndex((i) => i.id === id)
      if (rollbackIdx !== -1) base.records.value[rollbackIdx] = before
      throw err
    }
  }

  async function remove(id: string) {
    await itemsRepo.remove(id)
  }

  return {
    items: base.records,
    loading: base.loading,
    fetchForList,
    create,
    update,
    toggle,
    remove,
    subscribe,
    unsubscribe,
  }
})
