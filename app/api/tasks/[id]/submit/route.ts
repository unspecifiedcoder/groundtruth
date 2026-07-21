import { NextRequest, NextResponse } from 'next/server'
import { getTask, transition, recordProofHash, recentProofHashes, bumpWorker } from '@/lib/db'
import { verifyProof } from '@/lib/verify'
import { settlePayment } from '@/lib/payment'
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

  // Run verification
  const recentHashes = await recentProofHashes(60)
  const result = await verifyProof(task.proof_spec as any, proofPayload, imageBuffers, recentHashes)

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

  // Transition to final state
  const finalState = await transition(params.id, 'submitted', result.outcome as any, {
    result,
    resolved_at: new Date().toISOString(),
  })

  // Trigger on-chain settlement if verified
  if (result.outcome === 'verified' && task.payment_ref) {
    settlePayment(task.payment_ref).catch(() => {})
  }

  // Bump worker stats
  const budgetUnits = BigInt(Math.round(parseFloat(task.budget_usdt) * 1_000_000))
  await bumpWorker({
    wallet: workerWallet,
    earned_units: result.outcome === 'verified' ? budgetUnits : BigInt(0),
    outcome: result.outcome === 'verified' ? 'completed' : result.outcome === 'failed' ? 'failed' : 'completed',
  }).catch(() => {})

  return NextResponse.json({
    task_id: params.id,
    outcome: result.outcome,
    checks: result.checks,
    message:
      result.outcome === 'verified'
        ? 'Proof verified! Payment will be sent to your wallet.'
        : result.outcome === 'needs_review'
        ? 'Proof under manual review. Hold tight.'
        : 'Proof did not pass verification.',
  })
}
