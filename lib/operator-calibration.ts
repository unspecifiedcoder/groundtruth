export type OperatorCalibrationEvidence = {
  calibration_reference: string
  payment_reference: string
  payment_amount_inr: number
  fresh_capture_pass: boolean
  location_pass: boolean
  checklist_pass: boolean
  safety_pass: boolean
  manual_review_pass: boolean
  payout_identity_verified: boolean
}

export function validateOperatorCalibration(evidence?: OperatorCalibrationEvidence): string | null {
  if (!evidence) return 'Calibration evidence is required before activation.'
  if (evidence.calibration_reference.trim().length < 3) return 'A calibration task or receipt reference is required.'
  if (evidence.payment_reference.trim().length < 3) return 'A payout system reference is required.'
  if (!Number.isFinite(evidence.payment_amount_inr) || evidence.payment_amount_inr < 180) return 'Calibration payout must be at least ₹180.'

  const requiredChecks: Array<[boolean, string]> = [
    [evidence.fresh_capture_pass, 'fresh capture'],
    [evidence.location_pass, 'location'],
    [evidence.checklist_pass, 'checklist completion'],
    [evidence.safety_pass, 'safety and privacy'],
    [evidence.manual_review_pass, 'manual review'],
    [evidence.payout_identity_verified, 'payout identity'],
  ]
  const failed = requiredChecks.find(([passed]) => !passed)
  return failed ? `Calibration failed the ${failed[1]} check.` : null
}
