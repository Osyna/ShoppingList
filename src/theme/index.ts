import { applyTheme, loadThemeName, saveThemeName } from './apply'
import { defaultTheme, themes, type ThemeDefinition } from './themes'

export type { ThemeDefinition } from './themes'
export { themes, defaultTheme } from './themes'
export { applyTheme, loadThemeName, saveThemeName } from './apply'

export function initTheme(): void {
  const saved = loadThemeName()
  const theme: ThemeDefinition =
    (saved && (themes as Record<string, ThemeDefinition>)[saved]) || defaultTheme
  applyTheme(theme)
}

export function setTheme(name: string): void {
  const theme =
    (themes as Record<string, ThemeDefinition>)[name] ?? defaultTheme
  applyTheme(theme)
  saveThemeName(theme.name)
}
