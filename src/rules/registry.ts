import type { RuleDefinition } from './types'

const registry = new Map<string, RuleDefinition<any>>()

export function registerRule<C extends Record<string, unknown>>(def: RuleDefinition<C>) {
  if (registry.has(def.id)) {
    console.warn(`[rules] overwriting existing rule "${def.id}"`)
  }
  registry.set(def.id, def as RuleDefinition<any>)
}

export function getRule(id: string): RuleDefinition<any> | undefined {
  return registry.get(id)
}

export function getAllRules(): RuleDefinition<any>[] {
  return [...registry.values()]
}
