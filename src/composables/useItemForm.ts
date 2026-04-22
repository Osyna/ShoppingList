import { computed, reactive, ref, watch, type Ref } from 'vue'
import type { Category, Item, ItemInput, QuantityUnit } from '../types'
import { useI18n } from '../i18n'
import { getCategoryAppearance } from './useCategoryAppearance'
import { formatQuantity } from '../utils/formatItem'
import type { UiSelectOption } from '../ui/types'

export interface ItemFormState {
  name: string
  quantityValue: number
  quantityUnit: QuantityUnit
  notes: string
  category: string
  icon: string | null
}

const BLANK: ItemFormState = {
  name: '',
  quantityValue: 1,
  quantityUnit: 'count',
  notes: '',
  category: '',
  icon: null,
}

export interface UseItemFormOptions {
  open: Ref<boolean>
  item: Ref<Item | null | undefined>
  categories: Ref<Category[] | readonly Category[]>
}

/**
 * Reactive form state + derived values for adding or editing an item.
 *
 * Resets itself on open/close and on item identity change. `buildInput()`
 * produces a `null`-safe, trimmed `ItemInput` ready for submission; returns
 * `null` if the name is blank (caller should no-op on null).
 */
export function useItemForm({ open, item, categories }: UseItemFormOptions) {
  const t = useI18n()

  const form = reactive<ItemFormState>({ ...BLANK })
  const editing = ref(false)

  function resetFromItem() {
    const src = item.value
    Object.assign(
      form,
      src
        ? {
            name: src.name,
            quantityValue: src.quantity_value,
            quantityUnit: src.quantity_unit,
            notes: src.notes ?? '',
            category: src.category ?? '',
            icon: src.icon ?? null,
          }
        : BLANK
    )
  }

  watch(
    open,
    (v) => {
      if (!v) return
      resetFromItem()
      editing.value = !item.value
    },
    { immediate: true }
  )

  watch(
    () => item.value?.id,
    () => open.value && resetFromItem()
  )

  const isNew = computed(() => !item.value)
  const title = computed(() => (isNew.value ? t.items.addTitle : t.items.editTitle))
  const submitLabel = computed(() => (isNew.value ? t.items.add : t.items.save))

  const unitOptions = computed<UiSelectOption[]>(() =>
    (['count', 'kg', 'L'] as const).map((v) => ({ value: v, label: t.items.units[v] }))
  )

  const categoryOptions = computed<UiSelectOption[]>(() => [
    { value: '', label: t.items.noCategory },
    ...categories.value.map((c) => ({ value: c.id, label: c.name })),
  ])

  const categoryName = computed(
    () =>
      (item.value?.category &&
        categories.value.find((c) => c.id === item.value!.category)?.name) ||
      t.items.noCategory
  )

  const categoryColor = computed(() => getCategoryAppearance(item.value?.category).color)

  const selectedCategoryColor = computed(
    () => getCategoryAppearance(form.category || undefined).color
  )

  const qtyDisplay = computed(() =>
    item.value ? formatQuantity(item.value, t.items.units) : ''
  )

  const updatedFormatted = computed(() => {
    const u = item.value?.updated
    if (!u) return ''
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date(u))
    } catch {
      return ''
    }
  })

  function buildInput(): ItemInput | null {
    const name = form.name.trim()
    if (!name) return null
    return {
      name,
      quantity_value: Number(form.quantityValue) || 0,
      quantity_unit: form.quantityUnit,
      notes: form.notes.trim() || undefined,
      category: form.category || null,
      icon: form.icon || null,
    }
  }

  function startEditing() {
    editing.value = true
  }

  function cancelEditing() {
    resetFromItem()
    editing.value = false
  }

  return {
    form,
    editing,
    isNew,
    title,
    submitLabel,
    unitOptions,
    categoryOptions,
    categoryName,
    categoryColor,
    selectedCategoryColor,
    qtyDisplay,
    updatedFormatted,
    buildInput,
    resetFromItem,
    startEditing,
    cancelEditing,
  }
}
