import type { Item, QuantityUnit } from '../types'

export type UnitLabels = Record<QuantityUnit, string>

export function formatQuantity(item: Item, units: UnitLabels): string {
  const v = item.quantity_value
  if (v == null || Number.isNaN(v) || v === 0) return ''
  const formatted = Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '')
  if (item.quantity_unit === 'count') return v === 1 ? '' : `×${formatted}`
  return `${formatted} ${units[item.quantity_unit] ?? ''}`.trim()
}
