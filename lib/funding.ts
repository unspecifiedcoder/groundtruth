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
 * explicitly enabled operator-funded campaign. During the MVP, even the
 * 0.01 USDT integration tier is dispatchable when its payment is recorded.
 */
export function isTaskFundedForDispatch(
  task: DispatchFundingTask,
  options: DispatchFundingOptions
): boolean {
  const minimum = options.minimumRewardUsdt ?? process.env.MIN_PUBLIC_REWARD_USDT ?? '0.01'
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
