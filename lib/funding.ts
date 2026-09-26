import { toUnits } from './money'

export interface DispatchFundingTask {
  budget_usdt: string
  payment_ref: string | null
}

export interface DispatchFundingOptions {
  hasRecordedPayment: boolean
  allowOperatorFundedCampaigns: boolean
  minimumRewardUsdt?: string
}

/**
 * A worker should only see or claim work backed by a recorded payment, or an
 * explicitly enabled operator-funded campaign. Low-cost integration probes are
 * private even when their micro-payment succeeds.
 */
export function isTaskFundedForDispatch(
  task: DispatchFundingTask,
  options: DispatchFundingOptions
): boolean {
  const minimum = options.minimumRewardUsdt ?? process.env.MIN_PUBLIC_REWARD_USDT ?? '2.00'
  let meetsMinimum = false
  try {
    meetsMinimum = toUnits(task.budget_usdt) >= toUnits(minimum)
  } catch {
    return false
  }
  if (!meetsMinimum) return false
  if (options.hasRecordedPayment) return true
  return options.allowOperatorFundedCampaigns && !!task.payment_ref?.startsWith('campaign-')
}
