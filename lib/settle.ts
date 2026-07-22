import { keccak256, toBytes } from 'viem'
import { settleOnChain, isSettled, explorerTx } from './chain'
import { transition, bumpWorker, getTask } from './db'
import { settlePayment } from './payment'
import { splitBudget } from './money'
import type { TaskResult } from './types'

const CONTRACT_ADDRESS = (process.env.PAYROLL_CONTRACT_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`
// Token the worker is actually paid in — mUSDT on X Layer testnet by default
// (the token the payment came in as). Overridable for a mainnet deployment.
const PAYOUT_TOKEN = (process.env.PAYOUT_TOKEN ?? process.env.X402_VERIFY_TOKEN ?? '0x725cCe0916d2E8682438732fD9e79803B4fAB2BD') as `0x${string}`
const PRICE_USDT = process.env.ASP_PRICE_USDT ?? '2.00'
const FEE_BPS = Number(process.env.ASP_FEE_BPS ?? '1200')

export interface SettleResult {
  success: boolean
  txHash?: string
  explorer?: string
  payout_usdt?: string
  error?: string
}

export async function settleTask(
  taskId: string,
  workerWallet: string,
  paymentRef: string,
  budgetUsdt?: string
): Promise<SettleResult> {
  // Derive idempotent task key
  const taskKey = keccak256(toBytes(taskId)) as `0x${string}`

  // Check if already settled on-chain (idempotency)
  try {
    const alreadySettled = await isSettled(CONTRACT_ADDRESS, taskKey)
    if (alreadySettled) {
      return { success: true, error: 'already_settled' }
    }
  } catch {
    // Chain unavailable — fall through to off-chain settle
  }

  // Split the task's actual budget (falls back to the configured price only if
  // no budget was recorded), so payouts reflect what the task advertised.
  const { payoutUnits, feeUnits } = splitBudget(budgetUsdt ?? PRICE_USDT, FEE_BPS)

  // Try on-chain settlement first
  let txHash: string | undefined
  try {
    if (CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      txHash = await settleOnChain({
        contractAddress: CONTRACT_ADDRESS,
        taskKey,
        workerAddress: workerWallet as `0x${string}`,
        tokenAddress: PAYOUT_TOKEN,
        payoutUnits,
        feeUnits,
      })
    }
  } catch (e) {
    // On-chain failed — keep the existing verification result; just flag it.
    const existing = ((await getTask(taskId))?.result as unknown as Record<string, unknown>) ?? {}
    await transition(taskId, 'verified', 'verified', {
      result: { checks: [], ...existing, outcome: 'verified', confidence: 1 } as unknown as TaskResult,
    })
    return {
      success: false,
      error: `on_chain_failed: ${e instanceof Error ? e.message : String(e)}`,
    }
  }

  // Confirm with x402 facilitator
  await settlePayment(paymentRef).catch(() => {})

  // Bump worker earnings
  await bumpWorker({
    wallet: workerWallet,
    earned_units: payoutUnits,
    outcome: 'completed',
  }).catch(() => {})

  const { fromUnits } = await import('./money')
  const payoutUsdt = fromUnits(payoutUnits)

  // Preserve the verification result (checks + notary verdict + vision) that the
  // submit step wrote — merge the settle info in rather than overwriting it, so
  // the notary verdict survives to the done screen and task_status.
  const existing = ((await getTask(taskId))?.result as unknown as Record<string, unknown>) ?? {}

  // Persist the payout on the task so the public ledger can show who was paid,
  // how much, and the on-chain tx. The settle txHash isn't stored anywhere else.
  await transition(taskId, 'verified', 'verified', {
    result: {
      checks: [],
      ...existing,
      outcome: 'verified',
      confidence: 1,
      settle: {
        worker: workerWallet,
        token: PAYOUT_TOKEN,
        payout_usdt: payoutUsdt,
        fee_usdt: fromUnits(feeUnits),
        tx_hash: txHash ?? null,
        explorer: txHash ? explorerTx(txHash) : null,
        settled_at: new Date().toISOString(),
      },
    } as unknown as TaskResult,
  }).catch(() => {})

  return {
    success: true,
    txHash,
    explorer: txHash ? explorerTx(txHash) : undefined,
    payout_usdt: payoutUsdt,
  }
}
