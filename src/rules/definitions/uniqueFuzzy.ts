import { registerRule } from '../registry'
import { RuleViolationError } from '../errors'
import { normalizeLoose } from '../utils/normalize'
import { fr } from '../../i18n/fr'
import type { RuleDefinition } from '../types'

const strings = fr.rules.definitions.unique_fuzzy

export const uniqueFuzzy: RuleDefinition = {
  id: 'unique_fuzzy',
  label: strings.label,
  description: strings.description,
  defaultConfig: {},
  hooks: {
    beforeItemCreate({ input, existingItems }) {
      const target = normalizeLoose(input.name)
      const hit = existingItems.find((i) => normalizeLoose(i.name) === target)
      if (hit) throw new RuleViolationError('unique_fuzzy', strings.conflict(hit.name))
    },
    beforeItemUpdate({ item, patch, existingItems }) {
      if (typeof patch.name !== 'string') return
      const target = normalizeLoose(patch.name)
      const hit = existingItems.find(
        (i) => i.id !== item.id && normalizeLoose(i.name) === target
      )
      if (hit) throw new RuleViolationError('unique_fuzzy', strings.conflict(hit.name))
    },
  },
}

registerRule(uniqueFuzzy)
