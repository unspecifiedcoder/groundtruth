import { NextRequest, NextResponse } from 'next/server'
import { HumanDoInputSchema } from '@/lib/types'
import { buildChallenge, verifyPayment } from '@/lib/payment'
import { recordPaymentRef, insertTask } from '@/lib/db'
import { planTask } from '@/lib/planner'

export async function POST(req: NextRequest) {
  // Check for x402 payment header
  const paymentHeader = req.headers.get('X-PAYMENT') ?? req.headers.get('x-payment')

  if (!paymentHeader) {
    // No payment — return 402 challenge
    return NextResponse.json(buildChallenge(), { status: 402 })
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

  // Verify payment
  const payment = await verifyPayment(paymentHeader, taskId)
  if (!payment.success) {
    return NextResponse.json(buildChallenge(), { status: 402 })
  }

  // Replay guard — reject if payment_ref already used
  const recorded = await recordPaymentRef({
    payment_ref: payment.paymentRef,
    task_id: taskId,
    amount_units: payment.amountUnits,
    fee_units: payment.feeUnits,
    payer_address: payment.payerAddress,
    tx_hash: payment.txHash,
  })
  if (!recorded) {
    return NextResponse.json({ error: 'Payment already used' }, { status: 409 })
  }

  // Use planner if no explicit proof_spec provided — or use what was provided
  const proofSpec = input.proof_spec ?? (await planTask(input.intent)).proof_spec

  // Create task in DB
  const expiresAt = new Date(Date.now() + (input.timeout_seconds ?? 3600) * 1000)
  const task = await insertTask({
    intent: input.intent,
    proof_spec: proofSpec,
    budget_usdt: input.budget_usdt,
    expires_at: expiresAt,
    payment_ref: payment.paymentRef,
  })

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
  return NextResponse.json(buildChallenge(), { status: 402 })
}
