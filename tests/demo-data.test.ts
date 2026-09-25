import { describe, expect, it } from 'vitest'
import { DEMO_CAMPAIGN, DEMO_TASKS } from '@/lib/demo-campaign'

describe('investor demo data', () => {
  it('labels the sample consistently with its row count', () => {
    expect(DEMO_CAMPAIGN.name.toLowerCase()).toContain('eight-store')
    expect(DEMO_TASKS).toHaveLength(8)
  })

  it('uses one currency and never assigns confidence to a rejected observation', () => {
    const prices = DEMO_TASKS.map(task => task.price).filter((value): value is string => !!value)
    expect(prices.every(price => price.startsWith('₹'))).toBe(true)
    expect(DEMO_TASKS.filter(task => task.status === 'failed').every(task => task.confidence === null)).toBe(true)
  })
})
