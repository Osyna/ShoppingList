import { describe, it, expect } from 'vitest'
import { escapeFilterValue } from '../src/utils/pbFilter'

describe('escapeFilterValue', () => {
  it('leaves plain strings intact', () => {
    expect(escapeFilterValue('hello')).toBe('hello')
  })

  it('escapes double quotes', () => {
    expect(escapeFilterValue('say "hi"')).toBe('say \\"hi\\"')
  })

  it('escapes backslashes before quotes', () => {
    const out = escapeFilterValue('path\\to"file')
    expect(out).toBe('path\\\\to\\"file')
  })
})
