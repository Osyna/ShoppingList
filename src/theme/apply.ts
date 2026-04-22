import type { ThemeDefinition } from './themes'
import { accentVariables, applyVariables, baseCssVariables } from '../design/cssVariables'

const THEME_STORAGE_KEY = 'shoppinglist.theme'
let baseApplied = false

function applyBaseOnce(): void {
  if (baseApplied) return
  applyVariables(baseCssVariables)
  baseApplied = true
}

export function applyTheme(theme: ThemeDefinition): void {
  applyBaseOnce()
  applyVariables(accentVariables(theme.name))
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme.name
  }
}

export function saveThemeName(name: string): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, name)
  } catch {
    /* ignore quota/private mode */
  }
}

export function loadThemeName(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    return null
  }
}
