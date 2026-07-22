import { NextRequest, NextResponse } from 'next/server'
import { getTask, transition, recordProofHash, recentProofHashes, bumpWorker } from '@/lib/db'
import { verifyProof } from '@/lib/verify'
import { settleTask } from '@/lib/settle'
import { runAfterResponse } from '@/lib/after'
import type { ProofPayload } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await handleSubmit(req, params)
  } catch (err) {
    console.error('[submit] unhandled error:', err)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}

async function handleSubmit(req: NextRequest, params: { id: string }) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form submission' }, { status: 400 })
  }

  const workerWallet = formData.get('worker_wallet') as string
  const proofType = formData.get('proof_type') as 'photo' | 'form'

  if (!workerWallet?.match(/^0x[0-9a-fA-F]{40}$/) || !proofType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const task = await getTask(params.id)
  if (!task || task.status !== 'claimed') {
    return NextResponse.json({ error: 'Task not in claimed state' }, { status: 409 })
  }
  if (task.worker_wallet !== workerWallet) {
    return NextResponse.json({ error: 'Not your task' }, { status: 403 })
  }

  // Build proof payload
  const imageBuffers: Buffer[] = []
  let proofPayload: ProofPayload

  if (proofType === 'photo') {
    const photos = formData.getAll('photos') as File[]
    for (const photo of photos) {
      const buf = Buffer.from(await photo.arrayBuffer())
      imageBuffers.push(buf)
    }
    proofPayload = {
      type: 'photo',
      storageKeys: photos.map(p => `${params.id}/${p.name}`),
      submittedAt: new Date().toISOString(),
    }
  } else {
    const rawForm = formData.get('form_data') as string
    let parsedForm: Record<string, string>
    try {
      parsedForm = JSON.parse(rawForm ?? '{}')
    } catch {
      return NextResponse.json({ error: 'Invalid form_data JSON' }, { status: 400 })
    }
    proofPayload = {
      type: 'form',
      formData: parsedForm,
      submittedAt: new Date().toISOString(),
    }
  }

  // Move to submitted
  const submitted = await transition(params.id, 'claimed', 'submitted', {
    proof_payload: proofPayload,
    submitted_at: new Date().toISOString(),
  })
  if (!submitted) {
    return NextResponse.json({ error: 'State transition failed' }, { status: 409 })
  }

  // Run verification (pass the task intent so AI vision can content-check photos)
  const recentHashes = await recentProofHashes(60)
  const result = await verifyProof(task.proof_spec as any, proofPayload, imageBuffers, recentHashes, task.intent)

  // Store proof hashes for dedup
  if (proofType === 'photo') {
    for (const buf of imageBuffers) {
      try {
        // Simple content hash for dedup tracking
        const { createHash } = await import('crypto')
        const hash = createHash('sha256').update(buf).digest('hex')
        await recordProofHash(params.id, hash)
      } catch {}
    }
  }

  // Integrity gate. A hard-fail (no image / garbage / wrong type / duplicate) is
  // blatant fraud → fail immediately, no agent needed.
  const integrityFailed = result.outcome === 'failed'
  if (integrityFailed) {
    await transition(params.id, 'submitted', 'failed', {
      result,
      resolved_at: new Date().toISOString(),
    })
    await bumpWorker({ wallet: workerWallet, earned_units: BigInt(0), outcome: 'failed' }).catch(() => {})
    return NextResponse.json({
      task_id: params.id,
      status: 'failed',
      integrity: result.outcome,
      checks: result.checks,
      vision: result.vision ?? null,
      message: 'Proof did not pass integrity checks.',
    })
  }

  // Store the result (checks + vision) on the submitted task.
  await transition(params.id, 'submitted', 'submitted', { result }).catch(() => {})

  // Auto-accept (default ON via AUTO_ACCEPT). The buyer-agent auto-verifies a
  // proof that passed integrity and releases the on-chain payout right away, so
  // an honest worker is paid in seconds and never waits on an offline agent.
  // Set AUTO_ACCEPT=false to require manual/agent accept via the review endpoint.
  const autoAccept = process.env.AUTO_ACCEPT !== 'false'
  if (autoAccept) {
    const verified = await transition(params.id, 'submitted', 'verified', {
      resolved_at: new Date().toISOString(),
    })
    if (verified) {
      // Settle in the background so the worker isn't blocked on the ~10s on-chain
      // confirmation. settleTask writes result.settle to the task when the tx
      // lands; the UI live-poll flips from "settling" to "paid" the moment it
      // appears. The task is already 'verified', so nothing else can re-claim it.
      runAfterResponse(() =>
        settleTask(params.id, workerWallet, task.payment_ref ?? '', task.budget_usdt)
      )
      return NextResponse.json({
        task_id: params.id,
        status: 'verified',
        integrity: result.outcome,
        checks: result.checks,
        vision: result.vision ?? null,
        settle: { status: 'pending' },
        message: 'Accepted — releasing your payout on-chain…',
      })
    }
  }

  return NextResponse.json({
    task_id: params.id,
    status: 'submitted',
    integrity: result.outcome,
    checks: result.checks,
    vision: result.vision ?? null,
    message: 'Proof submitted — awaiting the agent’s verification.',
  })
}
