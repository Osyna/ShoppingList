import type { RecordModel } from 'pocketbase'

export type QuantityUnit = 'count' | 'kg' | 'L'

export type ListRulesMap = Record<
  string,
  { enabled: boolean; config?: Record<string, unknown> }
>

export interface ShoppingList extends RecordModel {
  name: string
  /** Owner user id. */
  user: string
  rules?: ListRulesMap
  last_reset_at?: string
  /**
   * Additional user ids who have access. Optional — missing on lists
   * that were created before the feature shipped.
   */
  members?: string[]
}

export interface Category extends RecordModel {
  name: string
  user: string
}

export interface Item extends RecordModel {
  name: string
  quantity_value: number
  quantity_unit: QuantityUnit
  checked: boolean
  notes?: string
  category?: string
  list: string
  user: string
  icon?: string
}

export interface AuthUser extends RecordModel {
  email: string
  name?: string
}

/**
 * User-facing form/DTO shape for creating or editing an item.
 * Lives in types (not stores) so UI components can import it without
 * pulling a Pinia store into their build.
 */
export interface ItemInput {
  name: string
  quantity_value: number
  quantity_unit: QuantityUnit
  notes?: string
  category?: string | null
  icon?: string | null
}
