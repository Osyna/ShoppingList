import { shallowRef } from 'vue'
import { fr } from './fr'

export type Messages = typeof fr

const LOCALE_STORAGE_KEY = 'shoppinglist.locale'

// `locales` is populated lazily so non-default locales don't bloat the
// entry chunk. `setLocale('en')` dynamically imports the bundle.
export const locales: Record<string, Messages> = { fr }

export const availableLocales: readonly string[] = ['fr', 'en']

function readStoredLocale(): string | null {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY)
  } catch {
    return null
  }
}

function detectInitialLocale(): string {
  const stored = readStoredLocale()
  if (stored && availableLocales.includes(stored)) return stored
  if (typeof navigator !== 'undefined') {
    const nav = navigator.language?.slice(0, 2).toLowerCase()
    if (nav && availableLocales.includes(nav)) return nav
  }
  return 'fr'
}

const initial = detectInitialLocale()
const current = shallowRef<Messages>(locales[initial] ?? fr)

// Kick off loading of the initial non-default locale in the background.
if (initial !== 'fr') void loadLocale(initial)

const reactiveMessages = new Proxy({} as Messages, {
  get(_, key) {
    return Reflect.get(current.value, key)
  },
  has(_, key) {
    return Reflect.has(current.value, key)
  },
  ownKeys() {
    return Reflect.ownKeys(current.value)
  },
  getOwnPropertyDescriptor(_, key) {
    return Reflect.getOwnPropertyDescriptor(current.value, key)
  },
}) as Messages

export function useI18n(): Messages {
  return reactiveMessages
}

/** Lazy-load a locale bundle and register it in `locales`. Safe to call repeatedly. */
export async function loadLocale(name: string): Promise<Messages | null> {
  if (locales[name]) return locales[name]
  if (!availableLocales.includes(name)) return null
  if (name === 'en') {
    const mod = await import('./en')
    locales.en = mod.en
    return mod.en
  }
  return null
}

/** Switch the active locale, lazy-loading the bundle if needed. */
export async function setLocale(name: string): Promise<void> {
  const next = locales[name] ?? (await loadLocale(name))
  if (!next) return
  current.value = next
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, name)
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = name
}

export function getCurrentLocale(): string {
  return readStoredLocale() ?? 'fr'
}

export { fr } from './fr'
