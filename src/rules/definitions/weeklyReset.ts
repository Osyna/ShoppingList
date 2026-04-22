import { registerRule } from '../registry'
import { fr } from '../../i18n/fr'
import type { OnListOpenCtx, RuleDefinition } from '../types'

type WeeklyResetMode = 'uncheck' | 'delete_checked' | 'delete_all'

interface WeeklyResetConfig extends Record<string, unknown> {
  mode: WeeklyResetMode
  day: number
}

const strings = fr.rules.definitions.weekly_reset

function lastBoundary(day: number): Date {
  const now = new Date()
  const diff = (now.getDay() - day + 7) % 7
  const b = new Date(now)
  b.setHours(0, 0, 0, 0)
  b.setDate(b.getDate() - diff)
  return b
}

export const weeklyReset: RuleDefinition<WeeklyResetConfig> = {
  id: 'weekly_reset',
  label: strings.label,
  description: strings.description,
  defaultConfig: { mode: 'uncheck', day: 1 },
  configSchema: [
    {
      key: 'mode',
      label: strings.fields.mode,
      kind: 'select',
      options: [
        { value: 'uncheck', label: strings.fields.modeUncheck },
        { value: 'delete_checked', label: strings.fields.modeDeleteChecked },
        { value: 'delete_all', label: strings.fields.modeDeleteAll },
      ],
    },
    {
      key: 'day',
      label: strings.fields.day,
      kind: 'select',
      options: [
        { value: 1, label: strings.fields.monday },
        { value: 2, label: strings.fields.tuesday },
        { value: 3, label: strings.fields.wednesday },
        { value: 4, label: strings.fields.thursday },
        { value: 5, label: strings.fields.friday },
        { value: 6, label: strings.fields.saturday },
        { value: 0, label: strings.fields.sunday },
      ],
    },
  ],
  hooks: {
    async onListOpen({
      list,
      config,
      items,
      updateList,
      uncheckItem,
      deleteItem,
    }: OnListOpenCtx<WeeklyResetConfig>) {
      const boundary = lastBoundary(config.day)
      const lastReset = list.last_reset_at ? new Date(list.last_reset_at) : null
      if (lastReset && lastReset >= boundary) return

      if (config.mode === 'uncheck') {
        await Promise.all(items.filter((i) => i.checked).map((i) => uncheckItem(i.id)))
      } else if (config.mode === 'delete_checked') {
        await Promise.all(items.filter((i) => i.checked).map((i) => deleteItem(i.id)))
      } else if (config.mode === 'delete_all') {
        await Promise.all(items.map((i) => deleteItem(i.id)))
      }

      await updateList({ last_reset_at: new Date().toISOString() })
    },
  },
}

registerRule(weeklyReset)
