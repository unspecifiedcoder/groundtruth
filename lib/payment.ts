import { toUnits, splitBudget } from './money'

const FACILITATOR_URL = process.env.OKX_FACILITATOR_URL ?? 'https://www.okx.com/web3/build/ai'
const PAYMENT_TOKEN = process.env.OKX_PAYMENT_TOKEN ?? ''
const PAYMENT_NETWORK = process.env.OKX_PAYMENT_NETWORK ?? '196'
const PRICE_USDT = process.env.ASP_PRICE_USDT ?? '2.00'
const FEE_BPS = Number(process.env.ASP_FEE_BPS ?? '1200')
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export interface PaymentChallenge {
  x402Version: number
  accepts: PaymentOption[]
  error: string
}

export interface PaymentOption {
  scheme: string
  network: string
  maxAmountRequired: string
  resource: string
  description: string
  mimeType: string
  payTo: string
  maxTimeoutSeconds: number
  asset: string
  extra: { name: string; version: string }
}

export interface PaymentResult {
  success: boolean
  paymentRef: string
  payerAddress: string
  txHash?: string
  amountUnits: bigint
  feeUnits: bigint
  payoutUnits: bigint
}

export function buildChallenge(resourcePath = '/api/v1/human-do'): PaymentChallenge {
  const amountUnits = toUnits(PRICE_USDT)
  return {
    x402Version: 1,
    accepts: [
      {
        scheme: 'exact',
        network: PAYMENT_NETWORK,
        maxAmountRequired: amountUnits.toString(),
        resource: `${APP_URL}${resourcePath}`,
        description: 'GroundTruth task creation — Reality-as-a-Service',
        mimeType: 'application/json',
        payTo: PAYMENT_TOKEN,
        maxTimeoutSeconds: 300,
        asset: PAYMENT_TOKEN,
        extra: { name: 'GroundTruth Task', version: '1' },
      },
    ],
    error: 'Payment required',
  }
}

export async function verifyPayment(
  paymentHeader: string,
  taskId: string
): Promise<PaymentResult> {
  // Try OKX facilitator first
  try {
    const res = await fetch(`${FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x402Version: 1,
        paymentHeader,
        requirements: buildChallenge().accepts[0],
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.isValid) {
        const amountUnits = toUnits(PRICE_USDT)
        const { feeUnits, payoutUnits } = splitBudget(PRICE_USDT, FEE_BPS)
        return {
          success: true,
          paymentRef: data.paymentReference ?? `okx-${taskId}-${Date.now()}`,
          payerAddress: data.payer ?? '0x0000000000000000000000000000000000000000',
          txHash: data.txHash,
          amountUnits,
          feeUnits,
          payoutUnits,
        }
      }
    }
  } catch {
    // facilitator unreachable — fall through to txhash fallback
  }

  // Fallback: parse payment header directly (for local dev / facilitator outage)
  return parseFallback(paymentHeader, taskId)
}

export async function settlePayment(paymentRef: string): Promise<boolean> {
  try {
    const res = await fetch(`${FACILITATOR_URL}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentReference: paymentRef }),
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok
  } catch {
    return false
  }
}

function parseFallback(paymentHeader: string, taskId: string): PaymentResult {
  // Header is base64-encoded JSON in x402 spec
  try {
    const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'))
    const amountUnits = toUnits(PRICE_USDT)
    const { feeUnits, payoutUnits } = splitBudget(PRICE_USDT, FEE_BPS)
    return {
      success: true,
      paymentRef: decoded.paymentReference ?? `fallback-${taskId}-${Date.now()}`,
      payerAddress: decoded.from ?? '0x0000000000000000000000000000000000000000',
      txHash: decoded.txHash,
      amountUnits,
      feeUnits,
      payoutUnits,
    }
  } catch {
    // Cannot parse — payment invalid
    const amountUnits = toUnits(PRICE_USDT)
    const { feeUnits, payoutUnits } = splitBudget(PRICE_USDT, FEE_BPS)
    return {
      success: false,
      paymentRef: `invalid-${taskId}-${Date.now()}`,
      payerAddress: '0x0000000000000000000000000000000000000000',
      amountUnits,
      feeUnits,
      payoutUnits,
    }
  }
}
