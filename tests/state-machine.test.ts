import { describe, expect, it } from 'vitest'
import { canTransition } from '@/lib/types'

describe('task state machine', () => {
  it('permits the normal claim, submit, review, and settlement path', () => {
    expect(canTransition('pending', 'claimed')).toBe(true)
    expect(canTransition('claimed', 'submitted')).toBe(true)
    expect(canTransition('submitted', 'verified')).toBe(true)
  })

  it('does not reopen terminal work or skip the claim boundary', () => {
    expect(canTransition('verified', 'pending')).toBe(false)
    expect(canTransition('failed', 'claimed')).toBe(false)
    expect(canTransition('pending', 'verified')).toBe(false)
  })
})
