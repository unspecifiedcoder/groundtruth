import { describe, expect, it } from 'vitest'
import { validateOperatorCalibration, type OperatorCalibrationEvidence } from '@/lib/operator-calibration'

const valid: OperatorCalibrationEvidence = {
  calibration_reference: 'CAL-001',
  payment_reference: 'UPI-001',
  payment_amount_inr: 180,
  fresh_capture_pass: true,
  location_pass: true,
  checklist_pass: true,
  safety_pass: true,
  manual_review_pass: true,
  payout_identity_verified: true,
}

describe('operator calibration evidence', () => {
  it('accepts complete evidence at the minimum payout', () => {
    expect(validateOperatorCalibration(valid)).toBeNull()
  })

  it('rejects activation without evidence', () => {
    expect(validateOperatorCalibration()).toMatch(/required/i)
  })

  it('rejects a calibration payout below the published minimum', () => {
    expect(validateOperatorCalibration({ ...valid, payment_amount_inr: 179 })).toMatch(/₹180/)
  })

  it('rejects failed location evidence', () => {
    expect(validateOperatorCalibration({ ...valid, location_pass: false })).toMatch(/location/i)
  })

  it('rejects an unverified payout identity', () => {
    expect(validateOperatorCalibration({ ...valid, payout_identity_verified: false })).toMatch(/payout identity/i)
  })
})
