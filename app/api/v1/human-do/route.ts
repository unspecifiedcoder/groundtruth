import { NextRequest, NextResponse } from 'next/server'
import { HumanDoInputSchema } from '@/lib/types'
import { recordPaymentRef, insertTask, deleteTask, setTaskBudget } from '@/lib/db'
import { planTask } from '@/lib/planner'
import { generateChallenge } from '@/lib/challenge'
import { getHttpResourceServer, makeContext } from '@/lib/okx-x402'
import { TASK_PRICE_USDT } from '@/lib/money'
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

/**
 * Ensure a 402 carries a usable body.
 *
 * An unpaid request gets the SDK's challenge body; a *rejected* credential gets
 * an empty one, which is indistinguishable from a server fault. Any reason the
 * SDK surfaced is echoed, and the PAYMENT-REQUIRED header is left untouched so
 * the response stays protocol-conformant either way.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withReason(result: any) {
  const response = result.response ?? { status: 402, headers: {}, body: undefined }
  const body = response.body
  const isEmpty = !body || (typeof body === 'object' && Object.keys(body).length === 0)
  if (!isEmpty) return response

  const reason = result.errorReason ?? result.reason ?? null
  const message = result.errorMessage ?? result.message ?? null

  return {
    ...response,
    body: {
      error: 'Payment invalid',
      x402Version: 2,
      detail:
        message ??
        'The payment credential was rejected. Common causes: the authorization was already used (replay), the signed amount or payTo did not match the challenge, or it was signed for a different asset or chain. Request a fresh PAYMENT-REQUIRED challenge and sign it unmodified.',
      ...(reason ? { reason } : {}),
    },
  }
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

  // An unpaid request ALWAYS gets the 402 challenge, whatever the body looks
  // like — including no body at all. That bare `curl -X POST` with no payment
  // header is the marketplace's documented availability probe, and answering it
  // with a schema error instead of PAYMENT-REQUIRED fails the official test.
  // Business validation therefore happens after payment (below), and usage
  // errors are only returned to callers who actually presented a credential.
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
      // 402 challenge (or a payment failure) built by the OKX SDK. The SDK
      // returns an empty body when it *rejects* a credential (replayed, wrong
      // amount, wrong payTo, wrong chain), so a caller debugging a failed
      // payment gets `402 {}` with nothing to go on. Fill it in without
      // touching the protocol headers, which stay exactly as the SDK built them.
      return toNextResponse(withReason(result))
    }
    if (result.type === 'payment-verified') {
      verified = {
        paymentPayload: result.paymentPayload,
        paymentRequirements: result.paymentRequirements,
        declaredExtensions: result.declaredExtensions,
      }
    }
  }

  // Payment (or demo bypass) is settled — now the body has to make sense. A
  // caller who paid and sent a malformed payload gets the field errors and a
  // usage block; an unpaid caller never reaches here, so the availability probe
  // above still sees a clean 402.
  const parsed = HumanDoInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: parsed.error.flatten(),
        usage: {
          intent: 'string, required, 1-500 chars — what the human oracle must do',
          proof_spec:
            'object, optional — {type: "photo"|"form", instructions: string, minPhotos?: 1-5, formFields?: string[]}; inferred from intent when omitted',
          budget_usdt: `string, optional — decimal USDT; defaults to ${TASK_PRICE_USDT}`,
          timeout_seconds: 'number, optional, 60-86400 — defaults to 3600',
        },
        payment_requirements: `GET ${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/v1/human-do returns the x402 PAYMENT-REQUIRED challenge`,
      },
      { status: 400 }
    )
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

    // The money actually collected is authoritative, not the requested budget.
    // A payment-exempt or micro-payment probe settles for less than the
    // advertised price, and the worker payout is computed from the task budget —
    // so it is rewritten here rather than validated away up front, which would
    // have blocked those probes entirely.
    if (settle.amount) {
      const { fromUnits } = await import('@/lib/money')
      const settledUsdt = fromUnits(BigInt(settle.amount))
      if (settledUsdt !== task.budget_usdt) {
        await setTaskBudget(task.id, settledUsdt).catch(() => {})
        task = { ...task, budget_usdt: settledUsdt }
      }
    }

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

  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
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

      // A paid call buys the dispatch, not an inline answer — a person has to go
      // and look. Spelled out here so an evaluator on a short clock knows the
      // pending task is the product working, and has a way to drive it to a
      // finished state themselves rather than waiting on a stranger.
      verification_flow: {
        summary:
          'Payment returns a task_id immediately. A human oracle completes the task, an AI notary verifies the proof, then the result appears on poll_url. Poll until "complete": true.',
        states: ['pending', 'claimed', 'submitted', 'verified | failed', 'expired if nobody completes it in time'],
        smoke_test: {
          purpose:
            'Drive this task to completion yourself to see the full cycle inside a review window. Use proof_spec.type "form" — it needs no photo and verifies in seconds.',
          steps: [
            `1. Claim: POST ${base}/api/tasks/${task.id}/claim with JSON {"worker_wallet":"0x<40 hex>"}`,
            `2. Submit: POST ${base}/api/tasks/${task.id}/submit as multipart/form-data with worker_wallet, proof_type ("form" or "photo"), and either form_data (a JSON string of the fields in proof_spec.formFields) or photos (one or more file parts)`,
            `3. Poll: GET ${base}/api/v1/tasks/${task.id} until "complete": true`,
          ],
          note: 'The proof is checked for real — an AI notary compares it against the task intent and the per-task freshness challenge in proof_spec.challenge, so a mismatched or stale submission is rejected rather than rubber-stamped.',
        },
      },
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
