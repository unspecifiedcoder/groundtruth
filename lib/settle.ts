import { keccak256, toBytes } from 'viem'
import { settleOnChain, isSettled } from './chain'
import { transition, bumpWorker } from './db'
import { settlePayment } from './payment'
import { splitBudget } from './money'

const CONTRACT_ADDRESS = (process.env.PAYROLL_CONTRACT_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`
const PAYMENT_TOKEN = (process.env.OKX_PAYMENT_TOKEN ?? '0x0000000000000000000000000000000000000000') as `0x${string}`
const PRICE_USDT = process.env.ASP_PRICE_USDT ?? '2.00'
const FEE_BPS = Number(process.env.ASP_FEE_BPS ?? '1200')

export interface SettleResult {
  success: boolean
  txHash?: string
  error?: string
}

export async function settleTask(
  taskId: string,
  workerWallet: string,
  paymentRef: string
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

  const { payoutUnits, feeUnits } = splitBudget(PRICE_USDT, FEE_BPS)

  // Try on-chain settlement first
  let txHash: string | undefined
  try {
    if (CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      txHash = await settleOnChain({
        contractAddress: CONTRACT_ADDRESS,
        taskKey,
        workerAddress: workerWallet as `0x${string}`,
        tokenAddress: PAYMENT_TOKEN,
        payoutUnits,
        feeUnits,
      })
    }
  } catch (e) {
    // On-chain failed — record off-chain and flag for manual settlement
    await transition(taskId, 'verified', 'verified', {
      result: {
        outcome: 'verified',
        checks: [],
        confidence: 1,
      },
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

  return { success: true, txHash }
}
