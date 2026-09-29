import { describe, expect, it } from 'vitest'
import { validateCampaignCoverage } from '@/lib/campaign-coverage'

const activeOperators = Array.from({ length: 5 }, (_, index) => ({
  id: `operator-${index + 1}`,
  city: 'Hyderabad',
  status: 'active',
  calibration_verified: true,
}))

const valid = {
  lead: { launch_city: 'Hyderabad' },
  operators: activeOperators,
  city: 'Hyderabad',
  storeCities: ['Hyderabad', 'hyderabad'],
  localityScope: 'Madhapur, Kondapur and Gachibowli',
  reviewReference: 'coverage-review-001',
}

describe('campaign coverage release gate', () => {
  it('accepts a reviewed single-city campaign with five calibrated active operators', () => {
    expect(validateCampaignCoverage(valid)).toMatchObject({ ok: true, city: 'Hyderabad', operatorIds: activeOperators.map(operator => operator.id) })
  })

  it('rejects campaigns when supply is below the launch threshold', () => {
    expect(validateCampaignCoverage({ ...valid, operators: activeOperators.slice(0, 4) })).toMatchObject({ ok: false })
  })

  it('does not count uncalibrated, paused, or wrong-city operators', () => {
    const invalidOperators = [
      { ...activeOperators[0], calibration_verified: false },
      { ...activeOperators[1], status: 'paused' },
      { ...activeOperators[2], city: 'Bengaluru' },
    ]
    expect(validateCampaignCoverage({ ...valid, operators: [...activeOperators.slice(0, 2), ...invalidOperators] })).toMatchObject({ ok: false })
  })

  it('rejects a buyer-city or store-city mismatch', () => {
    expect(validateCampaignCoverage({ ...valid, city: 'Bengaluru' })).toMatchObject({ ok: false })
    expect(validateCampaignCoverage({ ...valid, storeCities: ['Hyderabad', 'Bengaluru'] })).toMatchObject({ ok: false })
  })

  it('requires an auditable locality review', () => {
    expect(validateCampaignCoverage({ ...valid, localityScope: '' })).toMatchObject({ ok: false })
    expect(validateCampaignCoverage({ ...valid, reviewReference: '' })).toMatchObject({ ok: false })
  })
})
