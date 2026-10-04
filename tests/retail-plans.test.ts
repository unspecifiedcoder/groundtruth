import { describe, expect, it } from 'vitest'
import { getRetailPlan, RETAIL_PLANS } from '../lib/retail-plans'

describe('retail revenue plans', () => {
  it('keeps the one-time pilot and recurring plans commercially distinct', () => {
    expect(getRetailPlan('launch_pilot')).toMatchObject({ priceLabel: '$199 once', checks: 25, timeline: 'one_time_launch' })
    expect(getRetailPlan('monthly_25')).toMatchObject({ priceLabel: '$249/month', checks: 25, timeline: 'monthly_recurring' })
    expect(getRetailPlan('monthly_75')).toMatchObject({ priceLabel: '$599/month', checks: 75, timeline: 'monthly_recurring' })
  })

  it('offers a non-binding scope path without inventing a price', () => {
    expect(getRetailPlan('unsure')).toMatchObject({ priceLabel: 'Scope first', timeline: 'recommend_scope' })
  })

  it('uses unique plan identifiers for reliable attribution', () => {
    expect(new Set(RETAIL_PLANS.map(plan => plan.id)).size).toBe(RETAIL_PLANS.length)
  })
})
