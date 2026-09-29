export const LAUNCH_PILOT_PRICE_USD = 199
export const LAUNCH_PILOT_CHECKS = 25
export const DEFAULT_CAMPAIGN_REWARD_USDT = '3.00'
export const MIN_CAMPAIGN_REWARD_USDT = 2
export const MAX_CAMPAIGN_REWARD_USDT = 5

export function campaignRewardWithinGuardrail(value: string): boolean {
  if (!/^\d+(\.\d{1,6})?$/.test(value)) return false
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= MIN_CAMPAIGN_REWARD_USDT && amount <= MAX_CAMPAIGN_REWARD_USDT
}

export function campaignRewardReserveUsd(rewardUsdt: string, checks: number): number {
  return Number(rewardUsdt) * checks
}
