import type { Item, ItemInput, ShoppingList } from '../types'

export interface BeforeItemCreateCtx<Config = Record<string, unknown>> {
  list: ShoppingList
  config: Config
  input: ItemInput
  existingItems: Item[]
}

export interface BeforeItemUpdateCtx<Config = Record<string, unknown>> {
  list: ShoppingList
  config: Config
  item: Item
  patch: Partial<Item>
  existingItems: Item[]
}

export interface OnListOpenCtx<Config = Record<string, unknown>> {
  list: ShoppingList
  config: Config
  items: Item[]
  updateList: (patch: Partial<ShoppingList>) => Promise<void>
  uncheckItem: (id: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

export type RuleEvent = 'beforeItemCreate' | 'beforeItemUpdate' | 'onListOpen'

export type RuleHooks<Config = any> = {
  beforeItemCreate?: (ctx: BeforeItemCreateCtx<Config>) => void | Promise<void>
  beforeItemUpdate?: (ctx: BeforeItemUpdateCtx<Config>) => void | Promise<void>
  onListOpen?: (ctx: OnListOpenCtx<Config>) => void | Promise<void>
}

export interface RuleConfigField {
  key: string
  label: string
  kind: 'select' | 'checkbox' | 'number'
  options?: Array<{ value: string | number; label: string }>
  min?: number
  max?: number
  step?: number
}

export interface RuleDefinition<Config extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  label: string
  description: string
  defaultConfig?: Config
  configSchema?: RuleConfigField[]
  hooks?: RuleHooks<Config>
}
