import { describe, expect, it } from 'vitest'
import { canTransitionOperatorApplication } from '@/lib/db'

describe('operator lifecycle', () => {
  it('requires calibration before first activation', () => {
    expect(canTransitionOperatorApplication('new', 'active')).toBe(false)
    expect(canTransitionOperatorApplication('new', 'shortlisted')).toBe(true)
    expect(canTransitionOperatorApplication('shortlisted', 'calibration_scheduled')).toBe(true)
    expect(canTransitionOperatorApplication('calibration_scheduled', 'active')).toBe(true)
  })

  it('does not reactivate rejected applicants', () => {
    expect(canTransitionOperatorApplication('rejected', 'active')).toBe(false)
    expect(canTransitionOperatorApplication('active', 'paused')).toBe(true)
    expect(canTransitionOperatorApplication('paused', 'active')).toBe(true)
  })
})
