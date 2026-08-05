import { NextRequest, NextResponse } from 'next/server'
import { HumanDoInputSchema } from '@/lib/types'
import { recordPaymentRef, insertTask, deleteTask } from '@/lib/db'
import { planTask } from '@/lib/planner'
import { generateChallenge } from '@/lib/challenge'
import { getHttpResourceServer, makeContext } from '@/lib/okx-x402'
import { TASK_PRICE_USDT, isExactPrice } from '@/lib/money'
import { explorerTx } from '@/lib/chain'

// Payments run through the OFFICIAL OKX Payment SDK (@okxweb3/x402-*): the
// challenge, the buyer-credential verification, and the on-chain settlement are
// all delegated to the OKX Facilitator/Broker. We never verify or settle
// ourselves — that self-hosted path was why the marketplace listing was
// rejected as "not integrated with the official OKX Payment SDK".

function toNextResponse(instructions: {
  status: number
  headers: Record<string, string>
  body?: unknown
  isHtml?: boolean
}): NextResponse {
  const { status, headers, body, isHtml } = instructions
  if (isHtml && typeof body === 'string') {
    return new NextResponse(body, { status, headers: { ...headers, 'Content-Type': 'text/html' } })
  }
  const res = NextResponse.json((body ?? {}) as Record<string, unknown>, { status })
  for (const [k, v] of Object.entries(headers ?? {})) res.headers.set(k, v)
  return res
}

export async function POST(req: NextRequest) {
  // Body is parsed up front: the SDK's dynamic price reads budget_usdt from it
  // to build the 402 challenge, so it must be available before payment handling.
  let body: unknown = null
  try {
    body = await req.json()
  } catch {
    body = null
  }

  // The price is fixed, so budget_usdt may be omitted — but if it is supplied it
  // has to match, and that is checked before the payment handshake starts.
  // Rejecting here rather than after settlement matters twice over: the caller
  // is told why instead of being silently charged a different number, and the
  // worker payout (derived from the task's budget_usdt in settle.ts) can never
  // exceed what was actually collected.
  const requestedBudget = (body as { budget_usdt?: unknown } | null)?.budget_usdt
  if (requestedBudget !== undefined && (typeof requestedBudget !== 'string' || !isExactPrice(requestedBudget))) {
    return NextResponse.json(
      {
        error: 'Invalid budget',
        detail: `budget_usdt must be exactly ${TASK_PRICE_USDT} USDT, or omitted`,
        price_usdt: TASK_PRICE_USDT,
      },
      { status: 400 }
    )
  }

  const demoKey = req.headers.get('X-DEMO-KEY')
  // Demo bypass is enabled ONLY when ADMIN_SECRET is explicitly configured.
  const adminSecret = process.env.ADMIN_SECRET
  const isDemoMode = !!adminSecret && demoKey === adminSecret

  let httpServer: Awaited<ReturnType<typeof getHttpResourceServer>> | null = null
  let verified: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paymentPayload: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paymentRequirements: any
    declaredExtensions?: Record<string, unknown>
  } | null = null

  if (!isDemoMode) {
    try {
      httpServer = await getHttpResourceServer()
    } catch (e) {
      return NextResponse.json(
        { error: 'Payment service unavailable', detail: e instanceof Error ? e.message : String(e) },
        { status: 503 }
      )
    }

    const result = await httpServer.processHTTPRequest(makeContext(req, body))
    if (result.type === 'payment-error') {
      // 402 challenge (or a payment failure) built by the OKX SDK.
      return toNextResponse(result.response)
    }
    if (result.type === 'payment-verified') {
      verified = {
        paymentPayload: result.paymentPayload,
        paymentRequirements: result.paymentRequirements,
        declaredExtensions: result.declaredExtensions,
      }
    }
  }

  // Validate the business payload only after payment has been verified.
  const parsed = HumanDoInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }
  const input = parsed.data

  // Use planner if no explicit proof_spec provided. Attach a per-task freshness
  // challenge the worker must include in the proof, so a stale/stock image
  // (which can't contain this code) is rejected.
  const baseSpec = input.proof_spec ?? (await planTask(input.intent)).proof_spec
  const proofSpec = { ...baseSpec, challenge: generateChallenge() }

  const expiresAt = new Date(Date.now() + (input.timeout_seconds ?? 3600) * 1000)
  let task
  try {
    task = await insertTask({
      intent: input.intent,
      proof_spec: proofSpec,
      budget_usdt: input.budget_usdt,
      expires_at: expiresAt,
      payment_ref: `x402-${crypto.randomUUID()}`,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[human-do] insertTask failed:', detail)
    return NextResponse.json({ error: 'Task creation failed', detail }, { status: 500 })
  }

  const settlementHeaders: Record<string, string> = {}
  let settlementTx: string | null = null

  if (!isDemoMode && httpServer && verified) {
    // Settle through the OKX Facilitator. Only after it confirms do we keep the
    // task; a settlement failure must not leave an unpaid task on the board.
    const settle = await httpServer.processSettlement(
      verified.paymentPayload,
      verified.paymentRequirements,
      verified.declaredExtensions
    )

    if (!settle.success) {
      await deleteTask(task.id).catch(() => {})
      return toNextResponse(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (settle as any).response ?? {
          status: 402,
          headers: (settle.headers ?? {}) as Record<string, string>,
          body: {
            error: 'Payment settlement failed',
            reason: settle.errorReason,
            message: settle.errorMessage,
          },
        }
      )
    }

    Object.assign(settlementHeaders, settle.headers ?? {})
    settlementTx = settle.transaction ?? null

    const { toUnits, splitBudget } = await import('@/lib/money')
    let recorded = false
    try {
      recorded = await recordPaymentRef({
        payment_ref: task.payment_ref ?? `x402-${task.id}`,
        task_id: task.id,
        amount_units: settle.amount ? BigInt(settle.amount) : toUnits(input.budget_usdt),
        fee_units: splitBudget(input.budget_usdt, Number(process.env.ASP_FEE_BPS ?? '1200')).feeUnits,
        payer_address: settle.payer ?? '',
        tx_hash: settle.transaction ?? '',
      })
    } catch (err) {
      await deleteTask(task.id).catch(() => {})
      return NextResponse.json(
        { error: 'Failed to record payment', detail: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      )
    }
    if (!recorded) {
      // Replayed payment (payment_ref or tx_hash already used).
      await deleteTask(task.id).catch(() => {})
      return NextResponse.json({ error: 'Payment already used' }, { status: 409 })
    }
  }

  const res = NextResponse.json(
    {
      task_id: task.id,
      status: task.status,
      intent: task.intent,
      proof_spec: task.proof_spec,
      budget_usdt: task.budget_usdt,
      expires_at: task.expires_at,
      poll_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/v1/tasks/${task.id}`,

      // Say the async contract out loud. Two things settle independently: the
      // payment gets mined, and a human physically completes the task. The
      // PAYMENT-RESPONSE receipt is written before the transfer is mined, so it
      // reads `status: pending` with `success: true` — that is the broker
      // confirming the payment, not a failure. Poll `poll_url` until `complete`.
      async: true,
      payment: settlementTx
        ? { status: 'pending_confirmation', transaction: settlementTx, verify: explorerTx(settlementTx) }
        : null,
      next_step: `Poll ${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/v1/tasks/${task.id} until "complete": true. It reports payment finality and proof verification separately.`,
    },
    { status: 201 }
  )
  // PAYMENT-RESPONSE / settlement proof headers from the OKX SDK.
  for (const [k, v] of Object.entries(settlementHeaders)) res.headers.set(k, v)
  return res
}

export async function GET(req: NextRequest) {
  // Discovery: return the SDK-built 402 challenge so agents can learn the
  // payment requirements for this resource.
  try {
    const httpServer = await getHttpResourceServer()
    const result = await httpServer.processHTTPRequest(makeContext(req, null))
    if (result.type === 'payment-error') return toNextResponse(result.response)
    return NextResponse.json({ error: 'Payment required' }, { status: 402 })
  } catch (e) {
    return NextResponse.json(
      { error: 'Payment service unavailable', detail: e instanceof Error ? e.message : String(e) },
      { status: 503 }
    )
  }
}
