import { describe, it, expect } from 'vitest'
import { tokens, accent, palette, categoryPalette } from '../src/design/tokens'
import {
  baseCssVariables,
  accentVariables,
  renderVariableBlock,
} from '../src/design/cssVariables'

describe('design tokens', () => {
  it('exposes a single canonical object', () => {
    expect(tokens.palette).toBe(palette)
    expect(tokens.accent).toBe(accent)
    expect(tokens.categoryPalette).toBe(categoryPalette)
  })

  it('every accent theme defines the four accent slots', () => {
    for (const [name, scheme] of Object.entries(accent)) {
      expect(scheme.base, `accent.${name}.base`).toBeTruthy()
      expect(scheme.soft, `accent.${name}.soft`).toBeTruthy()
      expect(scheme.ink, `accent.${name}.ink`).toBeTruthy()
      expect(scheme.warm, `accent.${name}.warm`).toBeTruthy()
    }
  })
})

describe('cssVariables', () => {
  it('base variables mirror palette + radii + shadows + type + easings', () => {
    expect(baseCssVariables['--paper']).toBe(palette.paper)
    expect(baseCssVariables['--ink']).toBe(palette.ink)
    expect(baseCssVariables['--radius']).toBe(tokens.radii.md)
    expect(baseCssVariables['--shadow-card']).toBe(tokens.shadows.card)
    expect(baseCssVariables['--font-sans']).toBe(tokens.typography.sans)
    expect(baseCssVariables['--spring']).toBe(tokens.easings.spring)
  })

  it('accentVariables returns only the accent slot vars', () => {
    const vars = accentVariables('sage')
    expect(vars['--accent']).toBe(accent.sage.base)
    expect(vars['--accent-soft']).toBe(accent.sage.soft)
    expect(vars['--accent-ink']).toBe(accent.sage.ink)
    expect(vars['--accent-warm']).toBe(accent.sage.warm)
  })

  it('renderVariableBlock serializes to CSS declarations', () => {
    const out = renderVariableBlock({ '--a': '1', '--b': '2' })
    expect(out).toContain('--a: 1;')
    expect(out).toContain('--b: 2;')
  })
})
