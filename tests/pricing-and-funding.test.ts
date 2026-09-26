import { describe, expect, it } from 'vitest'
import { resolveTaskPricing } from '../lib/money'
import { isTaskFundedForDispatch } from '../lib/funding'

describe('server-owned task pricing', () => {
  it('maps named tiers to useful exact rewards', () => {
    expect(resolveTaskPricing({ service_tier: 'quick_check' })).toEqual({ tier: 'quick_check', priceUsdt: '2.00' })
    expect(resolveTaskPricing({ service_tier: 'photo_visit' })).toEqual({ tier: 'photo_visit', priceUsdt: '5.00' })
    expect(resolveTaskPricing({ service_tier: 'urgent_visit' })).toEqual({ tier: 'urgent_visit', priceUsdt: '15.00' })
    expect(resolveTaskPricing({ service_tier: 'complex_visit' })).toEqual({ tier: 'complex_visit', priceUsdt: '50.00' })
  })

  it('keeps missing and arbitrary legacy prices in the private integration tier', () => {
    expect(resolveTaskPricing({})).toEqual({ tier: 'integration_test', priceUsdt: '0.01' })
    expect(resolveTaskPricing({ budget_usdt: '999.00' })).toEqual({ tier: 'integration_test', priceUsdt: '0.01' })
  })

  it('recognizes exact legacy tier prices without trusting arbitrary budgets', () => {
    expect(resolveTaskPricing({ budget_usdt: '5' })).toEqual({ tier: 'photo_visit', priceUsdt: '5.00' })
  })
})

describe('worker-board funding boundary', () => {
  const paidTask = { budget_usdt: '5.00', payment_ref: 'x402-paid' }

  it('publishes a sufficiently funded paid task', () => {
    expect(isTaskFundedForDispatch(paidTask, {
      hasRecordedPayment: true,
      allowOperatorFundedCampaigns: false,
      minimumRewardUsdt: '2.00',
    })).toBe(true)
  })

  it('keeps micro-payment probes private even when payment succeeded', () => {
    expect(isTaskFundedForDispatch({ ...paidTask, budget_usdt: '0.01' }, {
      hasRecordedPayment: true,
      allowOperatorFundedCampaigns: false,
      minimumRewardUsdt: '2.00',
    })).toBe(false)
  })

  it('blocks stale tasks without a payment or authorised escrow', () => {
    expect(isTaskFundedForDispatch({ budget_usdt: '5.00', payment_ref: 'internal-seed' }, {
      hasRecordedPayment: false,
      allowOperatorFundedCampaigns: false,
      minimumRewardUsdt: '2.00',
    })).toBe(false)
  })

  it('allows explicitly enabled operator-funded campaigns', () => {
    expect(isTaskFundedForDispatch({ budget_usdt: '5.00', payment_ref: 'campaign-pilot-1' }, {
      hasRecordedPayment: false,
      allowOperatorFundedCampaigns: true,
      minimumRewardUsdt: '2.00',
    })).toBe(true)
  })
})
