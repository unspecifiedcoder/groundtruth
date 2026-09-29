import { describe, expect, it } from 'vitest'
import { calculateSalesMetrics, canTransitionPilotLead, isPilotLeadStatus } from '../lib/sales-pipeline'

describe('evidence-backed sales pipeline', () => {
  it('permits only forward commercial transitions', () => {
    expect(canTransitionPilotLead('new', 'qualified')).toBe(true)
    expect(canTransitionPilotLead('qualified', 'scope_sent')).toBe(true)
    expect(canTransitionPilotLead('payment_pending', 'active')).toBe(true)
    expect(canTransitionPilotLead('active', 'churned')).toBe(true)
    expect(canTransitionPilotLead('new', 'paid')).toBe(false)
    expect(canTransitionPilotLead('churned', 'active')).toBe(false)
    expect(isPilotLeadStatus('active')).toBe(true)
    expect(isPilotLeadStatus('customer-ish')).toBe(false)
  })

  it('counts MRR only for active recurring leads with payment evidence', () => {
    const metrics = calculateSalesMetrics([
      { lead_status: 'active', cadence: 'monthly_25', payment_reference: 'bank-001', amount_received_usd: 249, recurring_monthly_usd: 249 },
      { lead_status: 'active', cadence: 'monthly_75', payment_reference: '', amount_received_usd: 599, recurring_monthly_usd: 599 },
      { lead_status: 'paid', cadence: 'launch_pilot', payment_reference: 'invoice-002', amount_received_usd: 199 },
      { lead_status: 'churned', cadence: 'monthly_75', payment_reference: 'bank-003', amount_received_usd: 599, recurring_monthly_usd: 599 },
    ])
    expect(metrics).toMatchObject({ active_recurring_customers: 1, verified_mrr_usd: 249, paid_pilots: 1, recorded_cash_usd: 1047 })
  })

  it('never turns a status label without evidence into revenue', () => {
    expect(calculateSalesMetrics([{ lead_status: 'active', cadence: 'monthly_75', recurring_monthly_usd: 599 }])).toMatchObject({ active_recurring_customers: 0, verified_mrr_usd: 0, recorded_cash_usd: 0 })
  })
})
