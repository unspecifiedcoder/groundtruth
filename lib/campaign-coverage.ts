export type CampaignCoverageLead = { launch_city?: unknown }
export type CampaignCoverageOperator = { id?: unknown; city?: unknown; status?: unknown; calibration_verified?: unknown }

export type CampaignCoverageResult =
  | { ok: true; operatorIds: string[]; city: string }
  | { ok: false; reason: string }

function normalized(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase() : ''
}

export function validateCampaignCoverage(input: {
  lead: CampaignCoverageLead
  operators: CampaignCoverageOperator[]
  city: string
  storeCities: string[]
  localityScope: string
  reviewReference: string
  minimumOperators?: number
}): CampaignCoverageResult {
  const city = input.city.trim()
  const normalizedCity = normalized(city)
  if (!normalizedCity || normalized(input.lead.launch_city) !== normalizedCity) {
    return { ok: false, reason: 'Coverage city must match the paid lead launch city' }
  }
  if (!input.storeCities.length || input.storeCities.some(storeCity => normalized(storeCity) !== normalizedCity)) {
    return { ok: false, reason: 'Every store must be explicitly assigned to the approved coverage city' }
  }
  if (input.localityScope.trim().length < 3) return { ok: false, reason: 'Document the reviewed locality or corridor scope' }
  if (input.reviewReference.trim().length < 3) return { ok: false, reason: 'A coverage review reference is required' }

  const operatorIds = input.operators
    .filter(operator => operator.status === 'active' && operator.calibration_verified === true && normalized(operator.city) === normalizedCity)
    .map(operator => typeof operator.id === 'string' ? operator.id : '')
    .filter(Boolean)
  const minimum = input.minimumOperators ?? 5
  if (operatorIds.length < minimum) {
    return { ok: false, reason: `At least ${minimum} calibrated active operators are required in ${city}; found ${operatorIds.length}` }
  }
  return { ok: true, operatorIds, city }
}
