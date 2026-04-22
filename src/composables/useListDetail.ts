import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { isAbort } from '../pb'
import type { Item, ShoppingList } from '../types'
import { useItemsStore } from '../stores/items'
import { useListsStore } from '../stores/lists'
import { useCategoriesStore } from '../stores/categories'
import { useToast } from './useToast'
import { usePersistentRef } from './usePersistentRef'
import { getCategoryAppearance } from './useCategoryAppearance'
import { useI18n } from '../i18n'
import { findNameConflict, runHooks } from '../rules/engine'
import { isRuleViolation } from '../rules/errors'
import { listsRepo, itemsRepo } from '../data/repositories'
import { byCreatedAsc, byRecencyDesc, frCompare } from '../utils/compare'
import type {
  ItemGroupKey,
  ItemSortKey,
} from '../components/items/ItemToolbar.vue'

export interface ItemGroup {
  key: string
  name: string
  color?: string
  items: Item[]
  order: number
}

/**
 * Everything ListDetailView needs that is not rendering: data loading,
 * realtime subscription lifecycle, rule hooks, grouping, conflict detection,
 * persistence of sort/group prefs.
 *
 * The view stays a thin template over this, and unit tests can target
 * the composable without mounting the SFC.
 */
export function useListDetail(listId: Ref<string>, hideChecked?: Ref<boolean>) {
  const router = useRouter()
  const items = useItemsStore()
  const lists = useListsStore()
  const categories = useCategoriesStore()
  const { error } = useToast()
  const t = useI18n()

  const list = ref<ShoppingList | null>(null)
  const query = ref('')
  const conflict = ref<{ ruleId: string; message: string } | null>(null)

  const sortBy = usePersistentRef<ItemSortKey>(
    'shoppinglist.items.sort',
    'created',
    ['updated', 'created', 'name']
  )
  const groupBy = usePersistentRef<ItemGroupKey>(
    'shoppinglist.items.group',
    'category',
    ['category', 'status']
  )

  function compareItems(a: Item, b: Item): number {
    if (sortBy.value === 'name') return frCompare(a.name, b.name)
    if (sortBy.value === 'updated') return byRecencyDesc(a, b)
    return byCreatedAsc(a, b)
  }

  async function loadList() {
    try {
      list.value = await listsRepo.getOne(listId.value)
    } catch {
      error(t.lists.notFound)
      router.push({ name: 'lists' })
    }
  }

  async function runOpenHooks() {
    const activeId = listId.value
    const openList = list.value
    if (!openList || openList.id !== activeId) return
    try {
      await runHooks('onListOpen', openList, {
        list: openList,
        items: items.items,
        updateList: async (patch) => {
          if (listId.value !== activeId) return
          const updated = await lists.update(openList.id, patch)
          if (listId.value !== activeId) return
          list.value = updated
        },
        uncheckItem: async (id) => {
          if (listId.value !== activeId) return
          await itemsRepo.setChecked(id, false)
        },
        deleteItem: async (id) => {
          if (listId.value !== activeId) return
          await itemsRepo.remove(id)
        },
      })
    } catch (e) {
      console.warn('[rules] onListOpen failed', e)
    }
  }

  onMounted(async () => {
    await loadList()
    await items.fetchForList(listId.value)
    await items.subscribe(listId.value)
    await runOpenHooks()
  })

  watch(listId, async (id, prev) => {
    if (id === prev) return
    await items.unsubscribe()
    await loadList()
    await items.fetchForList(id)
    await items.subscribe(id)
    await runOpenHooks()
  })

  let conflictDebounce: ReturnType<typeof setTimeout> | null = null
  let conflictSeq = 0
  watch([query, () => items.items, list], () => {
    const q = query.value.trim()
    if (!q || !list.value) {
      conflict.value = null
      if (conflictDebounce) {
        clearTimeout(conflictDebounce)
        conflictDebounce = null
      }
      return
    }
    if (conflictDebounce) clearTimeout(conflictDebounce)
    const seq = ++conflictSeq
    const activeList = list.value
    const activeQuery = q
    conflictDebounce = setTimeout(async () => {
      conflictDebounce = null
      const result = await findNameConflict(activeList, activeQuery, items.items)
      if (seq === conflictSeq) conflict.value = result
    }, 150)
  })

  onBeforeUnmount(async () => {
    if (conflictDebounce) {
      clearTimeout(conflictDebounce)
      conflictDebounce = null
    }
    await items.unsubscribe()
  })

  const categoryMap = computed(() => {
    const m = new Map<string, string>()
    for (const c of categories.categories) m.set(c.id, c.name)
    return m
  })

  const categoryNameOf = (id: string | undefined) => (id ? categoryMap.value.get(id) : undefined)

  const colorForCategoryId = (id: string | undefined): string => getCategoryAppearance(id).color
  const colorForItem = (it: Item) => colorForCategoryId(it.category ?? undefined)

  const visibleItems = computed(() =>
    hideChecked?.value ? items.items.filter((i) => !i.checked) : items.items
  )

  const grouped = computed<ItemGroup[]>(() => {
    const groups = new Map<string, ItemGroup>()
    const source = visibleItems.value

    if (groupBy.value === 'status') {
      for (const it of source) {
        const key = it.checked ? '__checked__' : '__unchecked__'
        const name = it.checked ? t.items.statusChecked : t.items.statusUnchecked
        const order = it.checked ? 1 : 0
        if (!groups.has(key)) groups.set(key, { key, name, items: [], order })
        groups.get(key)!.items.push(it)
      }
      const arr = [...groups.values()].sort((a, b) => a.order - b.order)
      for (const g of arr) g.items.sort(compareItems)
      return arr
    }

    for (const it of source) {
      const key = it.category ?? '__none__'
      const name = it.category
        ? categoryMap.value.get(it.category) ?? t.items.noCategory
        : t.items.noCategory
      const order = it.category ? 0 : 1
      const color = colorForCategoryId(it.category ?? undefined)
      if (!groups.has(key)) groups.set(key, { key, name, color, items: [], order })
      groups.get(key)!.items.push(it)
    }
    const arr = [...groups.values()]
    arr.sort((a, b) => a.order - b.order || frCompare(a.name, b.name))
    for (const g of arr) {
      // Intentionally do NOT sort checked items to the bottom within a
      // category: that reorder forced a FLIP animation on every toggle and
      // made checking items feel laggy. Strike-through + dim already
      // communicate "done"; let rows keep their position until the next
      // fetch / navigation re-sorts them.
      g.items.sort(compareItems)
    }
    return arr
  })

  const total = computed(() => items.items.length)
  const remaining = computed(() => items.items.filter((i) => !i.checked).length)
  const progress = computed(() => (total.value ? (total.value - remaining.value) / total.value : 0))
  const allDone = computed(() => total.value > 0 && remaining.value === 0)
  const canAdd = computed(() => query.value.trim().length > 0 && !conflict.value)

  function handleError(e: unknown) {
    if (isAbort(e)) return
    if (isRuleViolation(e)) error((e as { message: string }).message)
    else error(t.common.networkError)
  }

  return {
    list,
    query,
    conflict,
    sortBy,
    groupBy,
    grouped,
    total,
    remaining,
    progress,
    allDone,
    canAdd,
    categoryNameOf,
    colorForItem,
    handleError,
  }
}
