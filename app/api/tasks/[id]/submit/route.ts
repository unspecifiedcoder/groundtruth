import { NextRequest, NextResponse } from 'next/server'
import { getTask, transition, recordProofHash, recentProofHashes, bumpWorker, uploadProofFile, recordAuditEvent } from '@/lib/db'
import { verifyProof } from '@/lib/verify'
import { settleTask } from '@/lib/settle'
import { notaryReview } from '@/lib/notary'
import type { ProofPayload, ProofSpec, NotaryVerdict } from '@/lib/types'
import { rateLimit, sameOrigin, verifyClaimToken } from '@/lib/security'

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const earthRadius = 6_371_000
  const dLat = radians(bLat - aLat)
  const dLng = radians(bLng - aLng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * earthRadius * Math.asin(Math.sqrt(h))
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
    if (await rateLimit(req, 'task-submit', 12)) return NextResponse.json({ error: 'Too many submissions' }, { status: 429 })
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
  const claimToken = formData.get('claim_token') as string
  const proofType = formData.get('proof_type') as 'photo' | 'form'

  if (!workerWallet?.match(/^0x[0-9a-fA-F]{40}$/) || !proofType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (!claimToken || !verifyClaimToken(claimToken, params.id, workerWallet)) {
    return NextResponse.json({ error: 'Invalid or expired claim token. Claim the mission again.' }, { status: 403 })
  }

  const task = await getTask(params.id)
  // Allow a fresh submit (claimed) OR a RETRY of a failed attempt by the same
  // worker — an honest worker who blurred the code or missed the subject can try
  // again within the task window instead of being locked out.
  const isClaimed = task?.status === 'claimed'
  const isRetry = task?.status === 'failed' && task.worker_wallet === workerWallet
  if (!task || (!isClaimed && !isRetry)) {
    return NextResponse.json({ error: 'Task not open for submission' }, { status: 409 })
  }
  if (task.worker_wallet !== workerWallet) {
    return NextResponse.json({ error: 'Not your task' }, { status: 403 })
  }
  const fromStatus = task.status // 'claimed' or 'failed' (retry)

  const latitude = Number(formData.get('latitude'))
  const longitude = Number(formData.get('longitude'))
  const accuracy = Number(formData.get('accuracy_meters'))
  const capturedAt = formData.get('location_captured_at') as string | null
  const capturedTime = capturedAt ? Date.parse(capturedAt) : NaN
  const locationAge = Number.isFinite(capturedTime) ? Date.now() - capturedTime : Infinity
  const submittedLocation =
    Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
    Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 &&
    Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= 5_000 &&
    capturedAt && locationAge >= -120_000 && locationAge <= 10 * 60 * 1000
      ? { latitude, longitude, accuracy_meters: Math.max(0, accuracy), capturedAt }
      : undefined

  // Build proof payload
  const imageBuffers: Buffer[] = []
  let proofPayload: ProofPayload
  let submittedForm: Record<string, string> = {}
  const rawForm = formData.get('form_data') as string | null
  if (rawForm) {
    try {
      const decoded: unknown = JSON.parse(rawForm)
      if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded) || Object.values(decoded).some(value => typeof value !== 'string')) {
        return NextResponse.json({ error: 'Form answers must be strings' }, { status: 400 })
      }
      submittedForm = decoded as Record<string, string>
    } catch {
      return NextResponse.json({ error: 'Invalid form_data JSON' }, { status: 400 })
    }
  }

  if (proofType === 'photo') {
    const photos = formData.getAll('photos') as File[]
    if (photos.length < (task.proof_spec.minPhotos ?? 1) || photos.length > 5) {
      return NextResponse.json({ error: `Submit between ${task.proof_spec.minPhotos ?? 1} and 5 photos` }, { status: 400 })
    }
    for (const photo of photos) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(photo.type)) {
        return NextResponse.json({ error: 'Only image evidence is accepted' }, { status: 400 })
      }
      if (photo.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Each image must be 10MB or smaller' }, { status: 400 })
      }
      const buf = Buffer.from(await photo.arrayBuffer())
      const jpeg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
      const png = buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))
      const webp = buf.length >= 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP'
      const heif = buf.length >= 12 && buf.subarray(4, 8).toString() === 'ftyp'
      if (!jpeg && !png && !webp && !heif) return NextResponse.json({ error: 'Image contents do not match a supported format' }, { status: 400 })
      imageBuffers.push(buf)
    }
    const storageKeys = await Promise.all(
      photos.map((photo, index) => uploadProofFile({
        taskId: params.id,
        fileName: photo.name || `evidence-${index + 1}.jpg`,
        bytes: imageBuffers[index],
        contentType: photo.type,
      }))
    )
    proofPayload = {
      type: 'photo',
      storageKeys,
      ...(Object.keys(submittedForm).length ? { formData: submittedForm } : {}),
      submittedAt: new Date().toISOString(),
      ...(submittedLocation ? { location: submittedLocation } : {}),
    }
  } else {
    proofPayload = {
      type: 'form',
      formData: submittedForm,
      submittedAt: new Date().toISOString(),
      ...(submittedLocation ? { location: submittedLocation } : {}),
    }
  }

  // Run verification (dedup only matters for photos, so skip that read for
  // forms). Verify works on the in-memory payload, so we don't need to persist
  // the 'submitted' state first — we resolve straight to the final status in a
  // single write below, saving several cold DB round-trips.
  const recentHashes = proofType === 'photo' ? await recentProofHashes(60) : []
  const spec = task.proof_spec as ProofSpec
  const result = await verifyProof(spec, proofPayload, imageBuffers, recentHashes, task.intent)

  if (spec.formFields?.length) {
    const answers = proofPayload.formData ?? {}
    const missing = spec.formFields.filter(field => !answers[field]?.trim())
    result.checks.push({
      name: 'required_observations',
      passed: missing.length === 0,
      severity: 'hard',
      detail: missing.length ? `Missing: ${missing.join(', ')}` : `${spec.formFields.length} required observations supplied.`,
    })
    if (missing.length) result.outcome = 'failed'
  }

  if (spec.location) {
    const distance = submittedLocation
      ? distanceMeters(spec.location.latitude, spec.location.longitude, submittedLocation.latitude, submittedLocation.longitude)
      : null
    const reportedAccuracy = submittedLocation?.accuracy_meters ?? Infinity
    const allowed = spec.location.radius_meters + Math.min(reportedAccuracy, 100)
    const passed = distance !== null && reportedAccuracy <= 200 && distance <= allowed
    result.checks.push({
      name: 'target_location',
      passed,
      severity: 'hard',
      detail: distance === null
        ? 'Location was required but not submitted.'
        : reportedAccuracy > 200
          ? `Location accuracy was too low (±${Math.round(reportedAccuracy)}m; maximum ±200m).`
          : `${Math.round(distance)}m from target; ${spec.location.radius_meters}m task radius with ${Math.round(reportedAccuracy)}m reported accuracy.`,
    })
    if (!passed) result.outcome = 'failed'
  }

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

  // FAIL CLOSED: if a task carries a freshness challenge but the notary could not
  // actually run (vision/LLM skipped, errored, timed out, or hit a rate limit),
  // we cannot confirm the anti-fraud check — so we must NOT auto-pay. Hold the
  // proof for manual review instead. This means a rate-limited vision API can
  // never silently approve an unverified proof; it degrades safely.
  // Fail closed for the fraud-prone case: a PHOTO task (or any task carrying a
  // freshness challenge) whose notary could not actually run is held, not paid.
  const challenged = !!(task.proof_spec as ProofSpec).challenge
  const notaryCouldNotVerify = !!notary && notary.checked === false
  const holdForReview = (challenged || proofType === 'photo') && notaryCouldNotVerify

  // Single CAS transition from 'claimed' to the resolved status.
  //   failed   : integrity gate OR the notary confidently rejected the proof
  //   verified : passed + auto-accept → pay out in the background
  //   submitted: manual mode, OR held for review because verification was unavailable
  const target: 'failed' | 'verified' | 'submitted' =
    rejected ? 'failed' : (holdForReview || !autoAccept) ? 'submitted' : 'verified'

  const moved = await transition(params.id, fromStatus, target, {
    proof_payload: proofPayload,
    result,
    submitted_at: now,
    ...(target === 'submitted' ? {} : { resolved_at: now }),
  })
  if (!moved) {
    return NextResponse.json({ error: 'State transition failed' }, { status: 409 })
  }
  await recordAuditEvent({ event_type: `task.${target}`, actor_type: 'worker', actor_ref: workerWallet.toLowerCase(), resource_type: 'task', resource_id: params.id, metadata: { proof_type: proofType, check_count: result.checks.length } }).catch(() => {})

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
    // Settle SYNCHRONOUSLY so the payout is guaranteed before we respond — a
    // "verified but never paid" state is the worst thing a worker/judge can hit.
    // The on-chain wait (~5-8s on real infra) is covered by the "settling" UI.
    // Reliable on any runtime without a background-execution dependency.
    const settle = await settleTask(params.id, workerWallet, task.payment_ref ?? '', task.budget_usdt)
    return NextResponse.json({
      task_id: params.id,
      status: 'verified',
      integrity: result.outcome,
      notary,
      checks: result.checks,
      vision: result.vision ?? null,
      settle,
      message: settle.success ? 'Verified — payout settled on-chain.' : 'Verified — settlement is finalizing.',
    })
  }

  return NextResponse.json({
    task_id: params.id,
    status: 'submitted',
    integrity: result.outcome,
    notary,
    checks: result.checks,
    vision: result.vision ?? null,
    held_for_review: holdForReview,
    message: holdForReview
      ? 'Proof received — AI verification is temporarily unavailable, so it’s held for review. No payout is released until it’s verified.'
      : 'Proof submitted — awaiting the agent’s verification.',
  })
}
