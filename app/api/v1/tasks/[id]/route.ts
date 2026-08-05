import { NextRequest, NextResponse } from 'next/server'
import { getTask, getPaymentByTaskId } from '@/lib/db'
import { getTxConfirmation, explorerTx } from '@/lib/chain'

// Never cache task reads — the UI polls this for live status (claimed →
// submitted → verified). Without this, Next caches the first response (usually
// 'pending') and the poller never sees the task advance, so it hangs forever.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// A task is only finished when BOTH halves are final: the payment is mined and
// a human's proof has passed the notary. They complete independently and at
// very different speeds, so each is reported separately rather than collapsed
// into one ambiguous "pending" that reads like something is stuck.
const TERMINAL_TASK_STATUSES = new Set(['verified', 'failed', 'expired'])

function describe(paymentConfirmed: boolean, taskStatus: string): string {
  if (!paymentConfirmed && !TERMINAL_TASK_STATUSES.has(taskStatus)) {
    return 'Payment is broadcast but not yet mined, and a human oracle is still working on the task. Keep polling.'
  }
  if (!paymentConfirmed) {
    return 'Payment is broadcast but not yet mined. Keep polling; the transaction hash is verifiable on the explorer now.'
  }
  if (taskStatus === 'verified') return 'Complete: payment confirmed on-chain and the proof passed verification.'
  if (taskStatus === 'failed') return 'Payment confirmed on-chain, but the submitted proof failed verification.'
  if (taskStatus === 'expired') return 'Payment confirmed on-chain, but no human completed the task before it expired.'
  return 'Payment confirmed on-chain. Awaiting a human oracle to complete the task and the notary to verify the proof.'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await getTask(params.id)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Settlement finality is checked live rather than trusted from the receipt,
    // which is written before the transfer is mined.
    const payment = await getPaymentByTaskId(task.id).catch(() => null)
    const confirmation = payment?.tx_hash
      ? await getTxConfirmation(payment.tx_hash)
      : { confirmed: false }

    const proofFinal = TERMINAL_TASK_STATUSES.has(task.status)

    // Return safe public view — no payment_ref, no internal fields.
    // proof_payload IS the deliverable, so the paying agent can review it.
    return NextResponse.json({
      id: task.id,
      intent: task.intent,
      proof_spec: task.proof_spec,
      budget_usdt: task.budget_usdt,
      status: task.status,
      result: task.result,
      proof_payload: task.proof_payload ?? null,
      created_at: task.created_at,
      expires_at: task.expires_at,

      // Async by design — poll until `complete` is true.
      payment: {
        status: confirmation.confirmed ? 'confirmed' : 'pending',
        confirmed: confirmation.confirmed,
        transaction: payment?.tx_hash ?? null,
        payer: payment?.payer_address ?? null,
        block: confirmation.blockNumber ?? null,
        reverted: confirmation.reverted ?? false,
        explorer: payment?.tx_hash ? explorerTx(payment.tx_hash) : null,
      },
      proof: {
        status: task.status,
        final: proofFinal,
      },
      complete: confirmation.confirmed && task.status === 'verified',
      detail: describe(confirmation.confirmed, task.status),
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
