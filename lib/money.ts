const USDT_DECIMALS = 6n
const USDT_SCALE = 10n ** USDT_DECIMALS  // 1_000_000n

export function toUnits(usdt: string): bigint {
  const [whole, frac = ''] = usdt.split('.')
  const fracPadded = frac.padEnd(Number(USDT_DECIMALS), '0').slice(0, Number(USDT_DECIMALS))
  return BigInt(whole) * USDT_SCALE + BigInt(fracPadded)
}

export function fromUnits(units: bigint): string {
  const whole = units / USDT_SCALE
  const frac = units % USDT_SCALE
  if (frac === 0n) return whole.toString()
  return `${whole}.${frac.toString().padStart(Number(USDT_DECIMALS), '0').replace(/0+$/, '')}`
}

// Compatibility price advertised to marketplace discovery probes. Real field
// work uses the canonical server-owned tiers below; caller-controlled amounts
// never become worker liabilities.
export const TASK_PRICE_USDT = process.env.X402_PRICE ?? '0.01'

/**
 * Canonical task products. The integration tier preserves the marketplace's
 * low-cost compatibility probe, but it is intentionally below the public
 * worker-board threshold. Real field work must select a paid service tier.
 */
export const TASK_PRICE_TIERS = {
  integration_test: process.env.X402_PRICE ?? '0.01',
  evaluation_test: process.env.X402_EVALUATION_PRICE ?? '0.10',
  quick_check: process.env.X402_QUICK_PRICE ?? '2.00',
  photo_visit: process.env.X402_PHOTO_PRICE ?? '5.00',
  urgent_visit: process.env.X402_URGENT_PRICE ?? '15.00',
  complex_visit: process.env.X402_COMPLEX_PRICE ?? '50.00',
} as const

export type TaskPriceTier = keyof typeof TASK_PRICE_TIERS
export const DEFAULT_TASK_PRICE_TIER: TaskPriceTier = 'integration_test'

export function isTaskPriceTier(value: unknown): value is TaskPriceTier {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(TASK_PRICE_TIERS, value)
}

/**
 * Resolve a request to one of the server-owned prices. Legacy callers may send
 * one of the exact tier amounts in budget_usdt; arbitrary caller-controlled
 * amounts are never trusted as a payment quote.
 */
export function resolveTaskPricing(input: unknown): { tier: TaskPriceTier; priceUsdt: string } {
  const value = input && typeof input === 'object'
    ? input as { service_tier?: unknown; budget_usdt?: unknown }
    : {}

  if (isTaskPriceTier(value.service_tier)) {
    return { tier: value.service_tier, priceUsdt: TASK_PRICE_TIERS[value.service_tier] }
  }

  if (typeof value.budget_usdt === 'string') {
    const matchingTier = (Object.keys(TASK_PRICE_TIERS) as TaskPriceTier[])
      .find(tier => toUnits(TASK_PRICE_TIERS[tier]) === toUnitsSafe(value.budget_usdt as string))
    if (matchingTier) return { tier: matchingTier, priceUsdt: TASK_PRICE_TIERS[matchingTier] }
  }

  return {
    tier: DEFAULT_TASK_PRICE_TIER,
    priceUsdt: TASK_PRICE_TIERS[DEFAULT_TASK_PRICE_TIER],
  }
}

function toUnitsSafe(value: string): bigint | null {
  if (!/^\d+(\.\d{1,6})?$/.test(value)) return null
  try { return toUnits(value) } catch { return null }
}

/** True when `budgetUsdt` is a well-formed decimal exactly equal to the price. */
export function isExactPrice(budgetUsdt: string): boolean {
  // Zod runs every check on a string schema, so this can be handed a value that
  // already failed the format regex — don't let toUnits throw on it.
  if (!/^\d+(\.\d{1,6})?$/.test(budgetUsdt)) return false
  // Compare in integer units so "0.01", "0.010" and "0.0100" all match.
  return toUnits(budgetUsdt) === toUnits(TASK_PRICE_USDT)
}

export function splitBudget(
  budgetUsdt: string,
  feeBps: number
): { feeUnits: bigint; payoutUnits: bigint } {
  const total = toUnits(budgetUsdt)
  const feeBpsN = BigInt(feeBps)
  const feeUnits = (total * feeBpsN) / 10000n
  const payoutUnits = total - feeUnits
  return { feeUnits, payoutUnits }
}
