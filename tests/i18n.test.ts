import { describe, it, expect } from 'vitest'
import { fr, loadLocale, setLocale, useI18n, availableLocales } from '../src/i18n'

describe('i18n', () => {
  it('lists both locales', () => {
    expect(availableLocales).toContain('fr')
    expect(availableLocales).toContain('en')
  })

  it('defaults to French', () => {
    const t = useI18n()
    expect(t.common.loading).toBe(fr.common.loading)
  })

  it('lazy-loads the English bundle on demand', async () => {
    const en = await loadLocale('en')
    expect(en).not.toBeNull()
    expect(en!.common.loading).toBe('Loading…')
  })

  it('returns null for an unknown locale', async () => {
    const out = await loadLocale('zz')
    expect(out).toBeNull()
  })

  it('setLocale switches the reactive proxy', async () => {
    const t = useI18n()
    await setLocale('en')
    expect(t.common.loading).toBe('Loading…')
    await setLocale('fr')
    expect(t.common.loading).toBe(fr.common.loading)
  })
})
