import { describe, expect, it } from 'vitest'
import { validateCampaignFunding } from '../lib/campaign-funding'

const paidPilot = { company_name: 'Example Foods', cadence: 'launch_pilot', lead_status: 'paid', payment_reference: 'bank-GT-001', amount_received_usd: 199, payment_cycle: 'one-time' }

describe('campaign funding release gate', () => {
  it('releases a matching fully paid launch campaign with reserve coverage', () => {
    expect(validateCampaignFunding({ lead: paidPilot, customerName: 'Example Foods', taskCount: 25, rewardUsdt: '3.00', billingCycle: 'one-time' })).toMatchObject({ ok: true, requiredPriceUsd: 199, rewardReserveUsd: 75 })
  })

  it('rejects unpaid, mismatched, underpriced, and oversized campaigns', () => {
    expect(validateCampaignFunding({ lead: { ...paidPilot, lead_status: 'payment_pending' }, customerName: 'Example Foods', taskCount: 25, rewardUsdt: '3.00', billingCycle: 'one-time' })).toMatchObject({ ok: false })
    expect(validateCampaignFunding({ lead: paidPilot, customerName: 'Different Brand', taskCount: 25, rewardUsdt: '3.00', billingCycle: 'one-time' })).toMatchObject({ ok: false })
    expect(validateCampaignFunding({ lead: { ...paidPilot, amount_received_usd: 198 }, customerName: 'Example Foods', taskCount: 25, rewardUsdt: '3.00', billingCycle: 'one-time' })).toMatchObject({ ok: false })
    expect(validateCampaignFunding({ lead: paidPilot, customerName: 'Example Foods', taskCount: 26, rewardUsdt: '3.00', billingCycle: 'one-time' })).toMatchObject({ ok: false })
    expect(validateCampaignFunding({ lead: paidPilot, customerName: 'Example Foods', taskCount: 25, rewardUsdt: '3.00', billingCycle: '2026-09' })).toMatchObject({ ok: false })
  })

  it('requires recurring cadence before an active subscription can release work', () => {
    const active = { ...paidPilot, lead_status: 'active', cadence: 'monthly_25', amount_received_usd: 249, payment_cycle: '2026-09' }
    expect(validateCampaignFunding({ lead: active, customerName: 'Example Foods', taskCount: 25, rewardUsdt: '3.00', billingCycle: '2026-09' })).toMatchObject({ ok: true, requiredPriceUsd: 249 })
    expect(validateCampaignFunding({ lead: { ...active, cadence: 'launch_pilot' }, customerName: 'Example Foods', taskCount: 25, rewardUsdt: '3.00', billingCycle: '2026-09' })).toMatchObject({ ok: false })
    expect(validateCampaignFunding({ lead: active, customerName: 'Example Foods', taskCount: 25, rewardUsdt: '3.00', billingCycle: 'one-time' })).toMatchObject({ ok: false })
  })
})
