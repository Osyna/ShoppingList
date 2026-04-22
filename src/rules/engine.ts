/**
 * Rules engine — runs registered rule hooks against a list's state.
 *
 * To add a new rule:
 *   1. Create `src/rules/definitions/myRule.ts` that calls
 *      `registerRule({ id, label, description, defaultConfig, hooks })`.
 *   2. Import it from `src/rules/definitions/index.ts`.
 *   3. Add its i18n strings in `src/i18n/fr.ts` if the UI exposes it.
 *
 * Rule definitions are loaded lazily on first `runHooks` / `getRuleStateAsync`
 * / `ensureRuleDefinitions` call — do not import `./definitions` eagerly.
 */
import type { Item, ShoppingList } from '../types'
import type {
  BeforeItemCreateCtx,
  BeforeItemUpdateCtx,
  OnListOpenCtx,
  RuleEvent,
} from './types'
import { getRule } from './registry'
import { isRuleViolation } from './errors'

type ContextFor<E extends RuleEvent> = E extends 'beforeItemCreate'
  ? BeforeItemCreateCtx
  : E extends 'beforeItemUpdate'
    ? BeforeItemUpdateCtx
    : OnListOpenCtx

let definitionsLoaded: Promise<void> | null = null

export function ensureRuleDefinitions(): Promise<void> {
  if (!definitionsLoaded) {
    definitionsLoaded = import('./definitions').then(() => undefined)
  }
  return definitionsLoaded
}

export async function runHooks<E extends RuleEvent>(
  event: E,
  list: ShoppingList,
  context: Omit<ContextFor<E>, 'config'>
): Promise<void> {
  await ensureRuleDefinitions()
  const rulesMap = list.rules ?? {}
  for (const [ruleId, state] of Object.entries(rulesMap)) {
    if (!state?.enabled) continue
    const def = getRule(ruleId)
    const hook = def?.hooks?.[event]
    if (!def || !hook) continue
    const config = { ...(def.defaultConfig ?? {}), ...(state.config ?? {}) }
    await hook({ ...(context as object), config } as any)
  }
}

export async function findNameConflict(
  list: ShoppingList,
  name: string,
  existingItems: Item[]
): Promise<{ ruleId: string; message: string } | null> {
  const stub = { name, quantity_value: 1, quantity_unit: 'count' as const }
  try {
    await runHooks('beforeItemCreate', list, {
      list,
      input: stub as any,
      existingItems,
    })
    return null
  } catch (e) {
    if (isRuleViolation(e)) return { ruleId: e.ruleId, message: e.message }
    throw e
  }
}

export async function getRuleStateAsync(
  list: ShoppingList,
  ruleId: string
): Promise<{ enabled: boolean; config: Record<string, unknown> }> {
  await ensureRuleDefinitions()
  return getRuleState(list, ruleId)
}

export function getRuleState(
  list: ShoppingList,
  ruleId: string
): { enabled: boolean; config: Record<string, unknown> } {
  const def = getRule(ruleId)
  const stored = list.rules?.[ruleId]
  return {
    enabled: !!stored?.enabled,
    config: { ...(def?.defaultConfig ?? {}), ...(stored?.config ?? {}) },
  }
}
