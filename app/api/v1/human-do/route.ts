import { NextRequest, NextResponse } from 'next/server'
import { HumanDoInputSchema } from '@/lib/types'
import { buildChallenge, buildChallengeHeaderV2, verifyPayment } from '@/lib/payment'
import { recordPaymentRef, insertTask, deleteTask } from '@/lib/db'
import { planTask } from '@/lib/planner'
import { generateChallenge } from '@/lib/challenge'

// Body stays v1-shaped (unchanged, for our own client/tests); the
// PAYMENT-REQUIRED header carries the v2 shape, since that's what OKX's
// marketplace actually validates per the A2MCP docs.
function challengeResponse(status: number, extra?: Record<string, unknown>) {
  const res = NextResponse.json({ ...buildChallenge(), ...(extra ?? {}) }, { status })
  res.headers.set('PAYMENT-REQUIRED', buildChallengeHeaderV2())
  return res
}

export async function POST(req: NextRequest) {
  // Check for x402 payment header
  const paymentHeader = req.headers.get('X-PAYMENT') ?? req.headers.get('x-payment')
  const demoKey = req.headers.get('X-DEMO-KEY')
  // Demo bypass is enabled ONLY when ADMIN_SECRET is explicitly configured.
  // No hardcoded fallback secret — an unset env var means demo mode is off.
  const adminSecret = process.env.ADMIN_SECRET
  const isDemoMode = !!adminSecret && demoKey === adminSecret

  if (!paymentHeader && !isDemoMode) {
    // No payment — return 402 challenge
    return challengeResponse(402)
  }

  // Parse and validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = HumanDoInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const input = parsed.data

  // Generate task ID early (used as idempotency key in payment ref)
  const taskId = crypto.randomUUID()

  let paymentRef: string
  let amountUnits: bigint
  let feeUnits: bigint
  let payerAddress: string
  let txHash: string

  // Detect the spec-faithful x402 "exact" scheme (a signed Permit2 authorization).
  let x402Exact = false
  if (paymentHeader) {
    try { x402Exact = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf8')).scheme === 'exact' } catch { /* not exact */ }
  }

  if (isDemoMode) {
    paymentRef = `demo-${taskId}`
    amountUnits = BigInt(2000000)
    feeUnits = BigInt(240000)
    payerAddress = '0x0000000000000000000000000000000000000000'
    txHash = `0xdemo${taskId.replace(/-/g, '')}`
  } else if (x402Exact) {
    // x402 exact scheme — WE are the facilitator: verify the agent's signed
    // authorization, then settle it on-chain via Permit2 (pulls agent → payTo).
    const { verifyX402Payment, settleX402Payment } = await import('@/lib/x402')
    const { privateKeyToAccount } = await import('viem/accounts')
    const { toUnits, splitBudget } = await import('@/lib/money')
    const opKey = process.env.SETTLEMENT_PRIVATE_KEY as `0x${string}`
    const operator = privateKeyToAccount(opKey).address
    const token = (process.env.PAYOUT_TOKEN ?? process.env.X402_VERIFY_TOKEN ?? '0x725cCe0916d2E8682438732fD9e79803B4fAB2BD') as `0x${string}`
    const payTo = (process.env.X402_VERIFY_RECIPIENT ?? process.env.PAYROLL_CONTRACT_ADDRESS) as `0x${string}`
    const budgetUnits = toUnits(input.budget_usdt)

    const v = await verifyX402Payment(paymentHeader!, { token, minAmount: budgetUnits, payTo, spender: operator })
    if (!v.ok) return challengeResponse(402, { error: `x402 verify failed: ${v.reason}` })
    let settleTx: string
    try {
      settleTx = await settleX402Payment(paymentHeader!, opKey)
    } catch (e) {
      return NextResponse.json({ error: 'x402 settlement failed', detail: e instanceof Error ? e.message : String(e) }, { status: 402 })
    }
    paymentRef = `x402-${taskId}`
    amountUnits = v.amount!
    feeUnits = splitBudget(input.budget_usdt, Number(process.env.ASP_FEE_BPS ?? '1200')).feeUnits
    payerAddress = v.from!
    txHash = settleTx
  } else {
    const result = await verifyPayment(paymentHeader!, taskId)
    if (!result.success) {
      return challengeResponse(402)
    }
    paymentRef = result.paymentRef
    amountUnits = result.amountUnits
    feeUnits = result.feeUnits
    payerAddress = result.payerAddress
    txHash = result.txHash ?? ''
  }

  // Use planner if no explicit proof_spec provided — or use what was provided.
  // Attach a per-task freshness challenge the worker must include in the proof,
  // so a stale/stock image (that can't contain this code) is rejected.
  const baseSpec = input.proof_spec ?? (await planTask(input.intent)).proof_spec
  const proofSpec = { ...baseSpec, challenge: generateChallenge() }

  // At this point the payment is verified (and in the agent-pay flow, the mUSDT
  // transfer is already confirmed on-chain). Any failure below must not silently
  // swallow captured funds — surface it clearly so it can be reconciled.
  const expiresAt = new Date(Date.now() + (input.timeout_seconds ?? 3600) * 1000)
  let task
  try {
    // Create task first (payment record has FK to task)
    task = await insertTask({
      intent: input.intent,
      proof_spec: proofSpec,
      budget_usdt: input.budget_usdt,
      expires_at: expiresAt,
      payment_ref: paymentRef,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message
      : (err && typeof err === 'object') ? JSON.stringify(err) : String(err)
    console.error('[human-do] insertTask failed:', detail)
    return NextResponse.json(
      {
        error: 'Task creation failed after payment was captured',
        payment_ref: paymentRef,
        tx_hash: txHash || null,
        detail,
      },
      { status: 500 }
    )
  }

  // Record payment after task exists (avoids FK violation)
  if (!isDemoMode) {
    let recorded = false
    try {
      recorded = await recordPaymentRef({
        payment_ref: paymentRef,
        task_id: task.id,
        amount_units: amountUnits,
        fee_units: feeUnits,
        payer_address: payerAddress,
        tx_hash: txHash,
      })
    } catch (err) {
      // DB error recording payment — roll back the orphan task, then report.
      await deleteTask(task.id).catch(() => {})
      return NextResponse.json(
        { error: 'Failed to record payment', detail: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      )
    }
    if (!recorded) {
      // Replayed payment (payment_ref or tx_hash already used) — remove the
      // just-created task so no unpaid orphan remains on the board.
      await deleteTask(task.id).catch(() => {})
      return NextResponse.json({ error: 'Payment already used' }, { status: 409 })
    }
  }

  return NextResponse.json(
    {
      task_id: task.id,
      status: task.status,
      intent: task.intent,
      proof_spec: task.proof_spec,
      budget_usdt: task.budget_usdt,
      expires_at: task.expires_at,
      poll_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/v1/tasks/${task.id}`,
    },
    { status: 201 }
  )
}

export async function GET() {
  // GET returns 402 challenge so agents can discover payment requirements
  return challengeResponse(402)
}
