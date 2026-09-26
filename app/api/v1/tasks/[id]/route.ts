import { NextRequest, NextResponse } from 'next/server'
import { getTask, getPaymentByTaskId, transition, createProofUrls } from '@/lib/db'
import { getTxConfirmation, explorerTx } from '@/lib/chain'
import { canTransition, type TaskStatus } from '@/lib/types'
import { authorizedForCampaign } from '@/lib/campaign-auth'
import { rateLimit } from '@/lib/security'

// Never cache task reads — the UI polls this for live status (claimed →
// submitted → verified). Without this, Next caches the first response (usually
// 'pending') and the poller never sees the task advance, so it hangs forever.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// A task is only finished when BOTH halves are final: the payment is settled
// and a human's proof has passed the notary. They complete independently and at
// very different speeds, so each is reported separately rather than collapsed
// into one ambiguous "pending" that reads like something is stuck.
const TERMINAL_TASK_STATUSES = new Set<TaskStatus>(['verified', 'failed', 'expired'])

/**
 * Expire a task whose deadline has passed, at read time.
 *
 * There is no sweeper process, so without this a task nobody claims stays
 * `pending` forever — and since callers are told to poll until `complete`, that
 * is an infinite loop. Doing it on read fires exactly when someone is looking,
 * which is when it matters.
 *
 * `transition` is guarded on the current status, so concurrent pollers race
 * safely: the first wins, the rest get null and re-read. Only pending/claimed
 * may expire — a `submitted` task is awaiting the notary and must be allowed to
 * reach verified/failed, or a worker loses credit for work already done.
 */
async function expireIfDue(task: { id: string; status: TaskStatus; expires_at: string }) {
  if (TERMINAL_TASK_STATUSES.has(task.status)) return task.status
  if (new Date(task.expires_at).getTime() > Date.now()) return task.status
  if (!canTransition(task.status, 'expired')) return task.status

  const updated = await transition(task.id, task.status, 'expired').catch(() => null)
  return updated ? ('expired' as TaskStatus) : task.status
}

function describe(paymentState: 'confirmed' | 'pending' | 'recorded' | 'operator_escrow' | 'none', taskStatus: TaskStatus): string {
  const payPart =
    paymentState === 'confirmed'
      ? 'Payment confirmed on-chain.'
      : paymentState === 'pending'
        ? 'Payment is broadcast but not yet mined.'
        : paymentState === 'recorded'
          ? 'Payment was recorded by the facilitator, without a public transaction hash.'
          : paymentState === 'operator_escrow'
            ? 'Reward funding is reserved by an authorised operator campaign.'
            : 'No confirmed worker reward is attached to this task.'

  const proofPart =
    taskStatus === 'verified'
      ? 'The proof passed verification.'
      : taskStatus === 'failed'
        ? 'The submitted proof failed verification.'
        : taskStatus === 'expired'
          ? 'No human completed the task before it expired.'
          : taskStatus === 'submitted' || taskStatus === 'needs_review'
            ? 'A proof has been submitted and is being verified.'
            : 'Awaiting a human oracle to complete the task.'

  const poll = TERMINAL_TASK_STATUSES.has(taskStatus) && paymentState !== 'pending' ? '' : ' Keep polling.'
  return `${payPart} ${proofPart}${poll}`
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params
    if (await rateLimit(req, 'task-status', 180)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    const task = await getTask(routeParams.id)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const status = await expireIfDue(task)

    // Settlement finality is checked live rather than trusted from the x402
    // receipt, which is written before the transfer is mined.
    const record = await getPaymentByTaskId(task.id).catch(() => null)
    const confirmation = record?.tx_hash ? await getTxConfirmation(record.tx_hash) : null

    const operatorEscrowFunded =
      process.env.ALLOW_OPERATOR_FUNDED_CAMPAIGNS === 'true' &&
      !!task.campaign_id &&
      !!task.payment_ref?.startsWith('campaign-')

    // Do not infer funding merely because a task exists. A payment row without
    // a transaction is recorded but not independently on-chain confirmed.
    const paymentState: 'confirmed' | 'pending' | 'recorded' | 'operator_escrow' | 'none' = record?.tx_hash
      ? confirmation?.confirmed
        ? 'confirmed'
        : 'pending'
      : record
        ? 'recorded'
        : operatorEscrowFunded
          ? 'operator_escrow'
          : 'none'

    const payment =
      paymentState === 'none' || paymentState === 'recorded' || paymentState === 'operator_escrow'
        ? {
            status: paymentState,
            confirmed: false,
            transaction: null,
            payer: record?.payer_address ?? null,
            block: null,
            reverted: false,
            explorer: null,
            note: paymentState === 'operator_escrow'
              ? 'Reward funding is reserved by an authorised operator campaign; no per-task x402 transaction is attached.'
              : paymentState === 'recorded'
                ? 'A payment record exists, but no public transaction hash is available for independent confirmation.'
                : 'No payment or authorised operator escrow is attached. This task is not eligible for public worker dispatch.',
          }
        : {
            status: paymentState,
            confirmed: paymentState === 'confirmed',
            transaction: record!.tx_hash,
            payer: record!.payer_address ?? null,
            block: confirmation?.blockNumber ?? null,
            reverted: confirmation?.reverted ?? false,
            explorer: explorerTx(record!.tx_hash!),
          }

    const funded = paymentState === 'confirmed' || paymentState === 'recorded' || paymentState === 'operator_escrow'
    const complete = status === 'verified' && (paymentState === 'confirmed' || paymentState === 'recorded' || paymentState === 'operator_escrow')

    // Return a safe public view — no payment_ref, internal fields, or exact
    // worker coordinates. The location verdict remains visible in result.checks,
    // but a public task URL must not become a worker-location tracking endpoint.
    const evidenceAuthorized = task.campaign_id
      ? await authorizedForCampaign(req, task.campaign_id)
      : process.env.RECEIPTS_PUBLIC === 'true'
    const evidenceUrls = evidenceAuthorized && task.proof_payload?.storageKeys?.length
      ? await createProofUrls(task.proof_payload.storageKeys, 3600)
      : []
    const publicProof = task.proof_payload && evidenceAuthorized
      ? {
          ...task.proof_payload,
          ...(evidenceUrls.length ? { evidenceUrls, evidenceUrlsExpireIn: 3600 } : {}),
          ...(task.proof_payload.location
            ? {
                location: {
                  accuracy_meters: task.proof_payload.location.accuracy_meters,
                  capturedAt: task.proof_payload.location.capturedAt,
                  coordinates_redacted: true,
                },
              }
            : {}),
        }
      : null

    const publicSpec = {
      ...task.proof_spec,
      ...(task.proof_spec.location ? {
        location: {
          label: task.proof_spec.location.label,
          radius_meters: task.proof_spec.location.radius_meters,
          coordinates_redacted: true,
        },
      } : {}),
      challenge: undefined,
    }

    return NextResponse.json({
      id: task.id,
      intent: task.intent,
      proof_spec: evidenceAuthorized ? task.proof_spec : publicSpec,
      budget_usdt: task.budget_usdt,
      status,
      result: task.result,
      proof_payload: publicProof,
      evidence_access: evidenceAuthorized ? 'authorized' : 'restricted',
      created_at: task.created_at,
      expires_at: task.expires_at,

      // Async by design — poll until `complete` is true.
      payment,
      funded,
      proof: { status, final: TERMINAL_TASK_STATUSES.has(status) },
      complete,
      detail: describe(paymentState, status),
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
