import { describe, expect, it } from 'vitest'
import { calculateOperationsMetrics } from '@/lib/metrics'

describe('operations metrics', () => {
  it('computes acceptance, median turnaround, fees, and open liability', () => {
    const base = '2026-01-01T00:00:00.000Z'
    const metrics = calculateOperationsMetrics([
      { status: 'verified', budget_usdt: '10', created_at: base, submitted_at: base, resolved_at: '2026-01-01T00:10:00.000Z', result: { settle: { payout_usdt: '8.8', fee_usdt: '1.2' } } },
      { status: 'verified', budget_usdt: '10', created_at: base, submitted_at: base, resolved_at: '2026-01-01T00:30:00.000Z', result: { settle: { payout_usdt: '8.8', fee_usdt: '1.2' } } },
      { status: 'failed', budget_usdt: '10', created_at: base, submitted_at: base, resolved_at: '2026-01-01T00:05:00.000Z' },
      { status: 'pending', budget_usdt: '12', created_at: base, submitted_at: null, resolved_at: null },
    ], 20)
    expect(metrics).toMatchObject({ acceptance_rate_pct: 66.7, median_turnaround_minutes: 20, recorded_fee_margin_pct: 12, open_reward_liability_usdt: 12 })
  })
})
