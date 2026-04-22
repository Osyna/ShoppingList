import { describe, it, expect } from 'vitest'
import { ShareError } from '../src/stores/lists'

describe('ShareError', () => {
  it('carries a typed code and a human-readable message', () => {
    const e = new ShareError('notFound')
    expect(e.code).toBe('notFound')
    expect(e.name).toBe('ShareError')
    expect(e.message).toBe('notFound')
  })

  it('is identifiable with instanceof', () => {
    const e = new ShareError('alreadyMember')
    expect(e instanceof ShareError).toBe(true)
    expect(e instanceof Error).toBe(true)
  })
})
