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

// The single, fixed price of a task. This exact number is what the OKX service
// listing advertises, what the x402 challenge charges, and what the worker
// payout is computed from — one value, so the three can never disagree and a
// reviewer probing any call sees the registered fee.
//
// Pricing used to vary with the caller's budget. That is deliberately gone:
// `settleOnChain` derives the worker payout from the task's recorded
// `budget_usdt` (see settle.ts), so a challenge priced independently of that
// field would let a caller pay 0.01 while booking a 5.00 payout out of the
// operator's own wallet.
export const TASK_PRICE_USDT = process.env.X402_PRICE ?? '0.01'

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
