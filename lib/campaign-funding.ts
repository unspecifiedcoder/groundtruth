import { campaignRewardReserveUsd } from './pilot-economics'
import { getRetailPlan, type RetailPlanId } from './retail-plans'
import { isPilotLeadStatus, isRecurringCadence } from './sales-pipeline'

export type CampaignFundingLead = {
  company_name?: unknown
  cadence?: unknown
  lead_status?: unknown
  payment_reference?: unknown
  amount_received_usd?: unknown
  payment_cycle?: unknown
}

export type CampaignFundingResult =
  | { ok: true; paymentReference: string; amountReceivedUsd: number; requiredPriceUsd: number; rewardReserveUsd: number; cadence: RetailPlanId }
  | { ok: false; reason: string }

export function validateCampaignFunding(input: {
  lead: CampaignFundingLead
  customerName: string
  taskCount: number
  rewardUsdt: string
  billingCycle: string
}): CampaignFundingResult {
  const { lead } = input
  if (!isPilotLeadStatus(lead.lead_status) || !['paid', 'active'].includes(lead.lead_status)) {
    return { ok: false, reason: 'The linked lead is not paid or active' }
  }
  if (lead.lead_status === 'active' && !isRecurringCadence(lead.cadence)) {
    return { ok: false, reason: 'An active subscription must use a recurring plan' }
  }
  if (typeof lead.company_name !== 'string' || lead.company_name.trim().toLowerCase() !== input.customerName.trim().toLowerCase()) {
    return { ok: false, reason: 'Campaign customer must match the paid lead company' }
  }
  if (!['launch_pilot', 'monthly_25', 'monthly_75'].includes(String(lead.cadence))) {
    return { ok: false, reason: 'Choose a priced plan before releasing field work' }
  }
  const cadence = lead.cadence as RetailPlanId
  const plan = getRetailPlan(cadence)
  if (cadence === 'launch_pilot' && input.billingCycle !== 'one-time') return { ok: false, reason: 'Launch pilots must use the one-time billing cycle' }
  if (isRecurringCadence(cadence) && !/^20\d{2}-(0[1-9]|1[0-2])$/.test(input.billingCycle)) return { ok: false, reason: 'Recurring campaigns require a YYYY-MM billing cycle' }
  if (lead.payment_cycle !== input.billingCycle) return { ok: false, reason: 'The cleared payment evidence belongs to a different billing cycle' }
  if (input.taskCount > plan.checks) return { ok: false, reason: `The ${plan.name} plan supports at most ${plan.checks} checks per cycle` }
  const paymentReference = typeof lead.payment_reference === 'string' ? lead.payment_reference.trim() : ''
  const amountReceivedUsd = Number(lead.amount_received_usd)
  if (!paymentReference || !Number.isFinite(amountReceivedUsd) || amountReceivedUsd <= 0) {
    return { ok: false, reason: 'Cleared payment evidence is required before campaign release' }
  }
  const rewardReserveUsd = campaignRewardReserveUsd(input.rewardUsdt, input.taskCount)
  const requiredPriceUsd = plan.priceUsd ?? Number.POSITIVE_INFINITY
  if (amountReceivedUsd < requiredPriceUsd) return { ok: false, reason: `Received amount is below the ${plan.priceLabel} plan price` }
  if (amountReceivedUsd < rewardReserveUsd) return { ok: false, reason: 'Received amount does not cover the full worker reward reserve' }
  return { ok: true, paymentReference, amountReceivedUsd, requiredPriceUsd, rewardReserveUsd, cadence }
}
