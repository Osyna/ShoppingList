import { registerRule } from '../registry'
import { RuleViolationError } from '../errors'
import { normalizeStrict } from '../utils/normalize'
import { fr } from '../../i18n/fr'
import type { RuleDefinition } from '../types'

const strings = fr.rules.definitions.unique_strict

export const uniqueStrict: RuleDefinition = {
  id: 'unique_strict',
  label: strings.label,
  description: strings.description,
  defaultConfig: {},
  hooks: {
    beforeItemCreate({ input, existingItems }) {
      const target = normalizeStrict(input.name)
      const hit = existingItems.find((i) => normalizeStrict(i.name) === target)
      if (hit) throw new RuleViolationError('unique_strict', strings.conflict(hit.name))
    },
    beforeItemUpdate({ item, patch, existingItems }) {
      if (typeof patch.name !== 'string') return
      const target = normalizeStrict(patch.name)
      const hit = existingItems.find(
        (i) => i.id !== item.id && normalizeStrict(i.name) === target
      )
      if (hit) throw new RuleViolationError('unique_strict', strings.conflict(hit.name))
    },
  },
}

registerRule(uniqueStrict)
