import { toUnits, splitBudget } from './money'
import { verifyOnChainPayment } from './onchain-verify'

const FACILITATOR_URL = process.env.OKX_FACILITATOR_URL ?? 'https://www.okx.com/web3/build/ai'
// Must match onchain-verify.ts exactly — that module is the actual source of
// truth for what payment is accepted, so the advertised 402 challenge has to
// describe the same token/recipient/chain or a payer's wallet has nothing to pay.
const PAYMENT_ASSET = process.env.X402_VERIFY_TOKEN ?? '0x725cCe0916d2E8682438732fD9e79803B4fAB2BD'
const PAYMENT_RECIPIENT = process.env.X402_VERIFY_RECIPIENT ?? process.env.PAYROLL_CONTRACT_ADDRESS ?? '0x430172985b21458d73576435D4aD4bEeA85F376C'
const PAYMENT_CHAIN_ID = process.env.X402_VERIFY_CHAIN_ID ?? '1952'
const PAYMENT_NETWORK = `eip155:${PAYMENT_CHAIN_ID}` // CAIP-2 — X Layer testnet; this demo does not settle on mainnet
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
        description: 'GroundTruth task creation — Reality-as-a-Service (demo: X Layer testnet, not the mainnet OKX-standard USDT0 path)',
        mimeType: 'application/json',
        payTo: PAYMENT_RECIPIENT,
        maxTimeoutSeconds: 300,
        asset: PAYMENT_ASSET,
        extra: { name: 'GroundTruth Task (testnet mUSDT)', version: '1' },
      },
    ],
    error: 'Payment required',
  }
}

export async function verifyPayment(
  paymentHeader: string,
  taskId: string
): Promise<PaymentResult> {
  // Fast path: OKX facilitator explicitly validates the payment.
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
    // Facilitator reachable but did not validate (isValid=false, non-ok, etc.).
    // Do NOT trust the header on that basis — verify the claimed tx on-chain,
    // which is the real source of truth for our X Layer settlement.
  } catch {
    // Facilitator unreachable — fall through to on-chain verification.
  }

  return verifyOnChain(paymentHeader, taskId)
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

function invalid(taskId: string): PaymentResult {
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

// Decode the base64 x402 header, then PROVE the payment on-chain before
// accepting it. The header's self-declared fields (amount, from) are treated
// as untrusted hints; only the on-chain Transfer log is authoritative.
async function verifyOnChain(paymentHeader: string, taskId: string): Promise<PaymentResult> {
  let decoded: { txHash?: string; from?: string; paymentReference?: string }
  try {
    decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'))
  } catch {
    return invalid(taskId) // header is not valid base64 JSON
  }

  const requiredUnits = toUnits(PRICE_USDT)
  const chk = await verifyOnChainPayment({
    txHash: decoded.txHash,
    expectedFrom: decoded.from,
    requiredUnits,
  })

  if (!chk.valid) {
    return invalid(taskId)
  }

  // Record the amount actually transferred on-chain, not a hardcoded constant.
  const paidUnits = chk.amountUnits ?? requiredUnits
  const feeBpsN = BigInt(FEE_BPS)
  const feeUnits = (paidUnits * feeBpsN) / 10000n
  const payoutUnits = paidUnits - feeUnits

  return {
    success: true,
    // Bind the payment ref to the on-chain tx so replays of the same transfer
    // collide on the DB unique constraint regardless of a fresh paymentReference.
    paymentRef: decoded.paymentReference ?? `onchain-${chk.txHash}`,
    payerAddress: chk.from ?? decoded.from ?? '0x0000000000000000000000000000000000000000',
    txHash: chk.txHash,
    amountUnits: paidUnits,
    feeUnits,
    payoutUnits,
  }
}
