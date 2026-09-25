import { describe, expect, it } from 'vitest'
import { assessWorkerRisk } from '@/lib/risk'

describe('worker exposure policy', () => {
  it('limits concurrent missions even for a worker with good history', () => {
    expect(assessWorkerRisk({ completed: 20, failed: 1, activeClaims: 2 })).toMatchObject({ allowed: false })
  })

  it('blocks established wallets with a high failure rate', () => {
    expect(assessWorkerRisk({ completed: 2, failed: 4, activeClaims: 0 })).toMatchObject({ allowed: false })
  })

  it('allows a new worker with limited exposure', () => {
    expect(assessWorkerRisk({ completed: 0, failed: 0, activeClaims: 0 })).toMatchObject({ allowed: true, score: 0 })
  })
})
