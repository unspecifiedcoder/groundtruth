import { describe, expect, it } from 'vitest'
import { calculateAcquisitionMetrics } from '@/lib/acquisition-metrics'

const now = Date.parse('2026-09-29T12:00:00Z')

describe('acquisition metrics', () => {
  it('counts attributed events without calling them leads', () => {
    const metrics = calculateAcquisitionMetrics([], [
      { created_at: '2026-09-29T11:00:00Z', source: 'founder_email', prospect: 'rage_coffee' },
    ], now)
    expect(metrics.attributed_landing_events).toBe(1)
    expect(metrics.new_leads_awaiting_response).toBe(0)
  })

  it('flags only new leads older than 24 hours', () => {
    const metrics = calculateAcquisitionMetrics([
      { created_at: '2026-09-28T11:59:59Z', lead_status: 'new' },
      { created_at: '2026-09-29T11:00:00Z' },
      { created_at: '2026-09-27T12:00:00Z', lead_status: 'qualified' },
    ], [], now)
    expect(metrics.new_leads_awaiting_response).toBe(2)
    expect(metrics.stale_new_leads).toBe(1)
  })

  it('does not classify invalid timestamps as stale', () => {
    expect(calculateAcquisitionMetrics([{ created_at: 'invalid', lead_status: 'new' }], [], now).stale_new_leads).toBe(0)
  })
})
