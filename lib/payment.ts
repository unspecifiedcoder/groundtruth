import { toUnits, splitBudget } from './money'
import { verifyOnChainPayment } from './onchain-verify'

const FACILITATOR_URL = process.env.OKX_FACILITATOR_URL ?? 'https://www.okx.com/web3/build/ai'
// Must match onchain-verify.ts exactly — that module is the actual source of
// truth for what payment is accepted, so the advertised 402 challenge has to
// describe the same token/recipient/chain or a payer's wallet has nothing to pay.
const PAYMENT_ASSET = process.env.X402_VERIFY_TOKEN ?? '0x725cCe0916d2E8682438732fD9e79803B4fAB2BD'
const PAYMENT_RECIPIENT = process.env.X402_VERIFY_RECIPIENT ?? process.env.PAYROLL_CONTRACT_ADDRESS ?? '0x430172985b21458d73576435D4aD4bEeA85F376C'
const PAYMENT_CHAIN_ID = process.env.X402_VERIFY_CHAIN_ID ?? '1952'
const PAYMENT_NETWORK = `eip155:${PAYMENT_CHAIN_ID}` // CAIP-2
const IS_MAINNET = PAYMENT_CHAIN_ID === '196'
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
        payTo: PAYMENT_RECIPIENT,
        maxTimeoutSeconds: 300,
        asset: PAYMENT_ASSET,
        extra: { name: IS_MAINNET ? 'GroundTruth Task (USDT0)' : 'GroundTruth Task (testnet mUSDT)', version: '1' },
      },
    ],
    error: 'Payment required',
  }
}

// Per OKX's A2MCP docs: "for v2, base64-encode it and put it in the
// PAYMENT-REQUIRED response header — that header is what the marketplace
// validates, not the body." Our body has always been v1-shaped (flat
// `resource` string, `maxAmountRequired`); this builds the v2 shape
// (`resource` as an object, `amount` field) from the same challenge data,
// base64-encoded, for that header specifically. Additive — the v1 body is
// unchanged for our own client/tests.
export function buildChallengeHeaderV2(resourcePath = '/api/v1/human-do'): string {
  const opt = buildChallenge(resourcePath).accepts[0]
  const v2 = {
    x402Version: 2,
    resource: {
      url: opt.resource,
      description: opt.description,
      mimeType: opt.mimeType,
    },
    accepts: [
      {
        scheme: opt.scheme,
        network: opt.network,
        asset: opt.asset,
        amount: opt.maxAmountRequired,
        payTo: opt.payTo,
        maxTimeoutSeconds: opt.maxTimeoutSeconds,
        extra: opt.extra,
      },
    ],
  }
  return Buffer.from(JSON.stringify(v2)).toString('base64')
}

export async function verifyPayment(
  paymentHeader: string,
  taskId: string
): Promise<PaymentResult> {
  // No generic hosted OKX facilitator-verify endpoint exists (confirmed: the
  // previously-attempted URL returns 405 on every call, and OKX's own docs
  // describe no such endpoint) — we ARE the facilitator. Verify on-chain directly.
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
