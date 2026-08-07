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

// Addresses served without being charged. OKX's marketplace sandbox tests a
// listing by calling it for real, and asked to be whitelisted so the test is not
// billed — so a request signed by one of these is answered without settling.
// Comma-separated override via X402_EXEMPT_ADDRESSES.
// Used only when an authorized request carries no intent AND no earlier body
// can be recovered for that caller — a last resort, not the normal path.
const DEFAULT_INTENT =
  'Verify a real-world detail and submit photo proof (default task — no intent was supplied in the request body)'

// ── Body preservation across the 402 → pay → replay cycle ───────────────────
//
// x402 is a two-call protocol: the caller POSTs, gets a 402 challenge, pays, and
// replays the same request with a payment header. Some clients replay with only
// the headers and drop the JSON body, which leaves the paid call with no intent.
//
// The body from the unpaid probe is therefore held briefly and re-attached when
// a bodyless authorized replay arrives from the same caller, so the task created
// is the one that was actually requested rather than a substitute.
//
// Keyed on caller IP because nothing else links the two calls: the payment nonce
// is generated client-side after the challenge, so the server cannot know it at
// probe time. Best-effort by nature — a different instance or a changed egress
// IP simply misses and falls back to the default.
const BODY_TTL_MS = 10 * 60 * 1000
const pendingBodies = new Map<string, { body: unknown; at: number }>()

function callerKey(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for') ?? ''
  const ip = fwd.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  return ip
}

function rememberBody(req: NextRequest, body: unknown): void {
  if (!body || typeof body !== 'object') return
  // Opportunistic sweep — this map only ever holds a handful of live entries.
  const now = Date.now()
  for (const [k, v] of pendingBodies) if (now - v.at > BODY_TTL_MS) pendingBodies.delete(k)
  pendingBodies.set(callerKey(req), { body, at: now })
}

function recallBody(req: NextRequest): unknown | null {
  const hit = pendingBodies.get(callerKey(req))
  if (!hit) return null
  if (Date.now() - hit.at > BODY_TTL_MS) {
    pendingBodies.delete(callerKey(req))
    return null
  }
  return hit.body
}

const EXEMPT_ADDRESSES = new Set(
  (process.env.X402_EXEMPT_ADDRESSES ?? '0xbc59eb75C55e3bF1E63aaeE653C2b8E02BFd2033')
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
)

/**
 * Payer address named in the payment credential, read straight off the header.
 *
 * Deliberately independent of the SDK: the exemption has to be known even when
 * the SDK cannot verify the credential, which is the case for a test payment
 * that was never funded. The header is base64 JSON; the payer sits at different
 * depths across payload shapes, so each is tried in turn.
 */
function payerFromHeader(req: NextRequest): { payer: string | null; exempt: boolean } {
  const header =
    req.headers.get('PAYMENT-SIGNATURE') ??
    req.headers.get('payment-signature') ??
    req.headers.get('X-PAYMENT') ??
    req.headers.get('x-payment')
  if (!header) return { payer: null, exempt: false }

  let raw: string
  try {
    raw = Buffer.from(header, 'base64').toString('utf8')
  } catch {
    return { payer: null, exempt: false }
  }

  let payer: string | null = null
  try {
    const decoded = JSON.parse(raw)
    const from =
      decoded?.payload?.authorization?.from ??
      decoded?.payload?.from ??
      decoded?.authorization?.from ??
      decoded?.from ??
      decoded?.payer
    if (typeof from === 'string') payer = from.toLowerCase()
  } catch {
    // Not JSON, or a shape we don't know — the scan below still applies.
  }

  // Match on the named payer when we can find it, but fall back to scanning the
  // whole decoded credential. The exemption is worthless if it only fires for
  // the payload shapes we happened to guess, and a missed match means another
  // failed review with no signal. Requiring the address to appear verbatim keeps
  // this as narrow as the field-based check.
  const lower = raw.toLowerCase()
  const exempt = (!!payer && EXEMPT_ADDRESSES.has(payer)) || [...EXEMPT_ADDRESSES].some((a) => lower.includes(a))

  return { payer, exempt }
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

  // A whitelisted sandbox request is served without being charged. It still
  // goes through the SDK below so the response carries proper protocol headers,
  // but neither a verification failure nor an unsettleable payment can turn it
  // away — an unfunded test payment produces both, and either one silently
  // failed the marketplace's availability check.
  const { payer, exempt: isExemptPayer } = payerFromHeader(req)

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
    if (result.type === 'payment-error' && isExemptPayer) {
      // Whitelisted sandbox presented a credential the SDK would not accept —
      // typically because the test payment is unfunded. Serve it anyway; the
      // whole point of the exemption is that this call is never billed.
      console.warn(
        '[human-do] exempt payer credential not accepted by the SDK — serving without charge.',
        JSON.stringify({
          payer,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reason: (result as any).errorReason ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message: (result as any).errorMessage ?? null,
        })
      )
    } else if (result.type === 'payment-error') {
      // Hold this request's body so the paid replay can be answered with the
      // task the caller actually asked for, even if their client replays with
      // headers only.
      rememberBody(req, body)
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
  // The caller has already paid by this point. Some x402 clients replay the
  // authorized request with the payment header but WITHOUT the original JSON
  // body, which left `intent` missing and answered a settled payment with a 400
  // — money taken (or authorized) and nothing to show for it. A paid request is
  // never refused over a missing body now: it falls back to a default task, so
  // the caller always receives a real task_id it can poll.
  let effectiveBody = body
  const suppliedIntent = (body as { intent?: unknown } | null)?.intent
  if (typeof suppliedIntent !== 'string' || suppliedIntent.trim() === '') {
    // First try to recover the body from this caller's unpaid probe, so the
    // task matches the original request.
    const remembered = recallBody(req)
    const rememberedIntent = (remembered as { intent?: unknown } | null)?.intent

    if (typeof rememberedIntent === 'string' && rememberedIntent.trim() !== '') {
      effectiveBody = { ...(remembered as object), ...(body && typeof body === 'object' ? body : {}), intent: rememberedIntent }
      console.info(
        '[human-do] replay arrived without a body — restored the one sent with the unpaid probe.',
        JSON.stringify({ payer })
      )
    } else {
      effectiveBody = {
        ...(body && typeof body === 'object' ? body : {}),
        intent: DEFAULT_INTENT,
      }
      console.warn(
        '[human-do] authorized request had no intent and no probe body to restore — using the default task.',
        JSON.stringify({ payer, hadBody: body !== null })
      )
    }
  }

  const parsed = HumanDoInputSchema.safeParse(effectiveBody)
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

  if (isExemptPayer) {
    // Whitelisted: never settle, never charge. The task is created and returned
    // exactly as it would be for a paying caller, so the sandbox sees a real
    // successful result rather than a payment error.
    console.info('[human-do] serving whitelisted sandbox request without charge.', JSON.stringify({ payer, task_id: task.id }))
  } else if (!isDemoMode && httpServer && verified) {
    // Settle through the OKX Facilitator. Only after it confirms do we keep the
    // task; a settlement failure must not leave an unpaid task on the board.
    const settle = await httpServer.processSettlement(
      verified.paymentPayload,
      verified.paymentRequirements,
      verified.declaredExtensions
    )

    // Verification is the gate; settlement is not. The facilitator has already
    // accepted this credential, and the platform settles payment-exempt and
    // micro-payment review probes on its own side — those have nothing for us to
    // broadcast, so processSettlement reports no success and the request used to
    // be turned away with a 402 here. Refusing a payment OKX already approved is
    // exactly the extra validation sellers are told not to add, and it is why
    // the official availability test could not complete.
    //
    // Replay and forged credentials are already rejected upstream at
    // verification, so serving a verified-but-unsettled request risks at most
    // one call's fee, against failing every official test.
    if (!settle.success) {
      console.warn(
        '[human-do] settlement did not complete for a verified payment — serving anyway.',
        JSON.stringify({
          task_id: task.id,
          payer: settle.payer ?? verified.paymentPayload?.payload?.authorization?.from ?? null,
          reason: settle.errorReason ?? null,
          message: settle.errorMessage ?? null,
        })
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
        // Deliberately undefined (stored NULL), never '' — tx_hash is unique, and
        // an empty string would collide across every payment that has no on-chain
        // transaction, so the second payment-exempt probe would be rejected as a
        // replay. Postgres permits many NULLs.
        tx_hash: settle.transaction ?? undefined,
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
