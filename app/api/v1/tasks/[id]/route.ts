import { NextRequest, NextResponse } from 'next/server'
import { getTask, getPaymentByTaskId, transition } from '@/lib/db'
import { getTxConfirmation, explorerTx } from '@/lib/chain'
import { canTransition, type TaskStatus } from '@/lib/types'

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

function describe(paymentState: 'confirmed' | 'pending' | 'none', taskStatus: TaskStatus): string {
  const payPart =
    paymentState === 'confirmed'
      ? 'Payment confirmed on-chain.'
      : paymentState === 'pending'
        ? 'Payment is broadcast but not yet mined.'
        : 'No x402 payment is attached to this task.'

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
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await getTask(params.id)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const status = await expireIfDue(task)

    // Settlement finality is checked live rather than trusted from the x402
    // receipt, which is written before the transfer is mined.
    const record = await getPaymentByTaskId(task.id).catch(() => null)
    const confirmation = record?.tx_hash ? await getTxConfirmation(record.tx_hash) : null

    // Three states, not two. A task created through an authorised internal path
    // (an OKX marketplace job, already funded via escrow) has no x402 payment at
    // all — reporting that as "pending" claims a transaction that does not exist
    // and can never confirm.
    const paymentState: 'confirmed' | 'pending' | 'none' = !record?.tx_hash
      ? 'none'
      : confirmation?.confirmed
        ? 'confirmed'
        : 'pending'

    const payment =
      paymentState === 'none'
        ? {
            status: 'none' as const,
            confirmed: false,
            transaction: null,
            payer: null,
            block: null,
            reverted: false,
            explorer: null,
            note: 'This task was not paid through the x402 endpoint — it originated from an authorised internal path such as an OKX marketplace job funded via escrow.',
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

    // With no x402 payment there is nothing to confirm, so completion turns on
    // the proof alone; otherwise both halves must be final.
    const complete = paymentState === 'none' ? status === 'verified' : paymentState === 'confirmed' && status === 'verified'

    // Return safe public view — no payment_ref, no internal fields.
    // proof_payload IS the deliverable, so the paying agent can review it.
    return NextResponse.json({
      id: task.id,
      intent: task.intent,
      proof_spec: task.proof_spec,
      budget_usdt: task.budget_usdt,
      status,
      result: task.result,
      proof_payload: task.proof_payload ?? null,
      created_at: task.created_at,
      expires_at: task.expires_at,

      // Async by design — poll until `complete` is true.
      payment,
      proof: { status, final: TERMINAL_TASK_STATUSES.has(status) },
      complete,
      detail: describe(paymentState, status),
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
