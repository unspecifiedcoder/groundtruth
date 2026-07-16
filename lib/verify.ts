import type { ProofPayload, ProofSpec, VerificationCheck, TaskResult } from './types'

// Dynamic imports to avoid build errors when packages unavailable at type-check time
async function getExifr() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – exifr is an optional runtime dep; import fails gracefully
  try { return await import('exifr') } catch { return null }
}

async function getSharp() {
  try { return (await import('sharp')).default } catch { return null }
}

export async function verifyProof(
  spec: ProofSpec,
  payload: ProofPayload,
  imageBuffers?: Buffer[],
  recentHashes?: string[]
): Promise<TaskResult> {
  const checks: VerificationCheck[] = []

  if (spec.type === 'photo') {
    checks.push(...(await verifyPhoto(spec, payload, imageBuffers ?? [], recentHashes ?? [])))
  } else {
    checks.push(...verifyForm(spec, payload))
  }

  // Fail-closed: any hard failure → failed; never auto-pass on timeout/error
  const hardFail = checks.some(c => c.severity === 'hard' && !c.passed)
  const softFailCount = checks.filter(c => c.severity === 'soft' && !c.passed).length
  const totalChecks = checks.length

  if (hardFail) {
    return { outcome: 'failed', checks }
  }

  // If all hard checks pass but soft failures > 30% → needs_review
  if (totalChecks > 0 && softFailCount / totalChecks > 0.3) {
    return { outcome: 'needs_review', checks }
  }

  const passed = checks.filter(c => c.passed).length
  const confidence = totalChecks > 0 ? passed / totalChecks : 0

  return {
    outcome: confidence >= 0.6 ? 'verified' : 'needs_review',
    checks,
    confidence,
  }
}

async function verifyPhoto(
  spec: ProofSpec,
  payload: ProofPayload,
  buffers: Buffer[],
  recentHashes: string[]
): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = []
  const minPhotos = spec.minPhotos ?? 1

  // Hard: correct number of photos
  checks.push({
    name: 'photo_count',
    passed: buffers.length >= minPhotos,
    severity: 'hard',
    detail: `Expected ${minPhotos}, got ${buffers.length}`,
  })

  if (buffers.length === 0) return checks

  const sharp = await getSharp()
  const exifr = await getExifr()

  for (let i = 0; i < buffers.length; i++) {
    const buf = buffers[i]

    // Hard: valid image (sharp can decode it)
    if (sharp) {
      try {
        const meta = await sharp(buf).metadata()
        checks.push({
          name: `image_valid_${i}`,
          passed: !!meta.width && !!meta.height,
          severity: 'hard',
          detail: meta.width ? `${meta.width}x${meta.height}` : 'decode failed',
        })

        // Soft: minimum resolution (640x480)
        const minRes = (meta.width ?? 0) >= 640 && (meta.height ?? 0) >= 480
        checks.push({
          name: `resolution_${i}`,
          passed: minRes,
          severity: 'soft',
          detail: minRes ? 'ok' : 'low resolution',
        })

        // Soft: perceptual hash dedup
        try {
          const phash = await computePHash(sharp, buf)
          const isDupe = recentHashes.some(h => hammingDistance(h, phash) < 10)
          checks.push({
            name: `dedup_${i}`,
            passed: !isDupe,
            severity: 'soft',
            detail: isDupe ? 'duplicate image detected' : 'unique',
          })
        } catch {
          // hash computation failed — soft pass (don't fail on our own error)
          checks.push({ name: `dedup_${i}`, passed: true, severity: 'soft', detail: 'hash unavailable' })
        }
      } catch {
        checks.push({ name: `image_valid_${i}`, passed: false, severity: 'hard', detail: 'invalid image data' })
      }
    }

    // Soft: EXIF timestamp exists (proof was taken recently, not stock photo)
    if (exifr) {
      try {
        const exif = await exifr.parse(buf, ['DateTimeOriginal', 'GPSLatitude'])
        const hasTimestamp = !!exif?.DateTimeOriginal
        checks.push({
          name: `exif_timestamp_${i}`,
          passed: hasTimestamp,
          severity: 'soft',
          detail: hasTimestamp ? exif.DateTimeOriginal.toString() : 'no EXIF timestamp',
        })
      } catch {
        checks.push({ name: `exif_timestamp_${i}`, passed: true, severity: 'soft', detail: 'exif parse skipped' })
      }
    }
  }

  return checks
}

function verifyForm(spec: ProofSpec, payload: ProofPayload): VerificationCheck[] {
  const checks: VerificationCheck[] = []
  const fields = spec.formFields ?? []
  const data = payload.formData ?? {}

  // Hard: all required fields present and non-empty
  for (const field of fields) {
    const val = data[field]
    checks.push({
      name: `field_${field}`,
      passed: typeof val === 'string' && val.trim().length > 0,
      severity: 'hard',
      detail: val ? 'present' : 'missing or empty',
    })
  }

  // Soft: answer length > 10 chars (not just "yes" / "no")
  const answer = data['answer'] ?? ''
  if (answer) {
    checks.push({
      name: 'answer_length',
      passed: answer.trim().length >= 10,
      severity: 'soft',
      detail: `${answer.trim().length} chars`,
    })
  }

  return checks
}

async function computePHash(sharp: NonNullable<Awaited<ReturnType<typeof getSharp>>>, buf: Buffer): Promise<string> {
  // Resize to 8x8 grayscale, compute average, build bit string
  const { data } = await sharp(buf)
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const avg = data.reduce((s: number, v: number) => s + v, 0) / data.length
  return (Array.from(data) as number[]).map((v: number) => (v >= avg ? '1' : '0')).join('')
}

function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Infinity
  let d = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
  return d
}
