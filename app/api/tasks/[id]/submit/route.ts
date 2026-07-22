import { NextRequest, NextResponse } from 'next/server'
import { getTask, transition, recordProofHash, recentProofHashes, bumpWorker } from '@/lib/db'
import { verifyProof } from '@/lib/verify'
import { settleTask } from '@/lib/settle'
import { runAfterResponse } from '@/lib/after'
import { notaryReview } from '@/lib/notary'
import type { ProofPayload, ProofSpec, NotaryVerdict } from '@/lib/types'

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

  // Run verification (dedup only matters for photos, so skip that read for
  // forms). Verify works on the in-memory payload, so we don't need to persist
  // the 'submitted' state first — we resolve straight to the final status in a
  // single write below, saving several cold DB round-trips.
  const recentHashes = proofType === 'photo' ? await recentProofHashes(60) : []
  const result = await verifyProof(task.proof_spec as any, proofPayload, imageBuffers, recentHashes, task.intent)

  // Store proof hashes for dedup (photos only)
  if (proofType === 'photo') {
    for (const buf of imageBuffers) {
      try {
        const { createHash } = await import('crypto')
        const hash = createHash('sha256').update(buf).digest('hex')
        await recordProofHash(params.id, hash)
      } catch {}
    }
  }

  const now = new Date().toISOString()
  const integrityFailed = result.outcome === 'failed'

  // Semantic notary gate — the real content check. Only runs once integrity has
  // passed (no point asking an LLM to judge blatant garbage). It judges the
  // proof against the task intent and returns accept / reject / uncertain.
  // A CONFIDENT mismatch rejects; uncertain still pays (fail toward the worker).
  let notary: NotaryVerdict | null = null
  if (!integrityFailed) {
    notary = await notaryReview(task.intent, task.proof_spec as ProofSpec, proofPayload, imageBuffers)
    result.notary = notary
  }
  const semanticReject = notary?.decision === 'reject'
  const rejected = integrityFailed || semanticReject
  const autoAccept = process.env.AUTO_ACCEPT !== 'false'

  // Single CAS transition from 'claimed' to the resolved status.
  //   failed   : integrity gate OR the notary confidently rejected the proof
  //   verified : passed + auto-accept → pay out in the background
  //   submitted: passed + manual mode → wait for the agent's accept/reject
  const target: 'failed' | 'verified' | 'submitted' =
    rejected ? 'failed' : autoAccept ? 'verified' : 'submitted'

  const moved = await transition(params.id, 'claimed', target, {
    proof_payload: proofPayload,
    result,
    submitted_at: now,
    ...(target === 'submitted' ? {} : { resolved_at: now }),
  })
  if (!moved) {
    return NextResponse.json({ error: 'State transition failed' }, { status: 409 })
  }

  if (rejected) {
    await bumpWorker({ wallet: workerWallet, earned_units: BigInt(0), outcome: 'failed' }).catch(() => {})
    return NextResponse.json({
      task_id: params.id,
      status: 'failed',
      integrity: result.outcome,
      notary,
      checks: result.checks,
      vision: result.vision ?? null,
      message: semanticReject
        ? `Proof doesn't match the task${notary?.reason ? ` — ${notary.reason}` : ''}.`
        : 'Proof did not pass integrity checks.',
    })
  }

  if (target === 'verified') {
    // Settle in the background so the worker isn't blocked on on-chain
    // confirmation. settleTask writes result.settle when the tx lands; the UI
    // poll flips to "paid" then. The task is already 'verified' → not re-claimable.
    runAfterResponse(() =>
      settleTask(params.id, workerWallet, task.payment_ref ?? '', task.budget_usdt)
    )
    return NextResponse.json({
      task_id: params.id,
      status: 'verified',
      integrity: result.outcome,
      notary,
      checks: result.checks,
      vision: result.vision ?? null,
      settle: { status: 'pending' },
      message: 'Accepted — releasing your payout on-chain…',
    })
  }

  return NextResponse.json({
    task_id: params.id,
    status: 'submitted',
    integrity: result.outcome,
    notary,
    checks: result.checks,
    vision: result.vision ?? null,
    message: 'Proof submitted — awaiting the agent’s verification.',
  })
}
