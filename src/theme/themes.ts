import type { AccentName } from '../design/tokens'
import { accent } from '../design/tokens'

export interface ThemeDefinition {
  name: AccentName
}

export const themes: Record<AccentName, ThemeDefinition> = (
  Object.keys(accent) as AccentName[]
).reduce(
  (acc, name) => {
    acc[name] = { name }
    return acc
  },
  {} as Record<AccentName, ThemeDefinition>
)

export const defaultTheme: ThemeDefinition = themes.crimson
