import type { ProofSpec, ProofPayload, NotaryVerdict } from './types'
import { verifyImageMatchesIntent, extractJson } from './groq-vision'

// The Notary: semantic judgment of proof-vs-intent — the real accept gate that
// turns "any image / any form pays" into genuine content verification.
//
//   photo → a vision model (Gemini via VISION_*) judges whether the image shows
//           the task being done.
//   form  → a text LLM (Groq via FORM_JUDGE_* / GROQ_API_KEY) judges whether the
//           answer plausibly satisfies the task.
//
// Fails toward the worker: only a CONFIDENT mismatch rejects. Anything the model
// is unsure about — or any API failure / missing key — returns 'uncertain', which
// the caller treats as accept-but-flag. An honest worker is never denied pay
// because our model hiccuped; only a blatant mismatch is stopped.

const REJECT_CONFIDENCE = Number(process.env.NOTARY_REJECT_CONFIDENCE ?? '0.6')

const FORM_API_URL = process.env.FORM_JUDGE_API_URL ?? 'https://api.groq.com/openai/v1/chat/completions'
const FORM_API_KEY = process.env.FORM_JUDGE_API_KEY ?? process.env.GROQ_API_KEY
const FORM_MODEL = process.env.FORM_JUDGE_MODEL ?? 'llama-3.3-70b-versatile'

const uncertain = (mode: 'photo' | 'form', reason: string): NotaryVerdict => ({
  decision: 'uncertain', confidence: 0, reason, checked: false, mode,
})

async function buildDataUrl(buf: Buffer): Promise<string> {
  try {
    const sharp = (await import('sharp')).default
    const fmt = (await sharp(buf).metadata()).format ?? 'jpeg'
    return `data:image/${fmt};base64,${buf.toString('base64')}`
  } catch {
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  }
}

export async function notaryReview(
  intent: string,
  spec: ProofSpec,
  payload: ProofPayload,
  imageBuffers: Buffer[] = []
): Promise<NotaryVerdict> {
  if (spec.type === 'photo') return reviewPhoto(intent, imageBuffers)
  return reviewForm(intent, spec, payload)
}

async function reviewPhoto(intent: string, imageBuffers: Buffer[]): Promise<NotaryVerdict> {
  if (!imageBuffers.length) return uncertain('photo', 'no image to review')
  const dataUrl = await buildDataUrl(imageBuffers[0])
  const v = await verifyImageMatchesIntent(dataUrl, intent)
  if (!v.checked) return uncertain('photo', v.reason)
  if (v.match) return { decision: 'accept', confidence: v.confidence, reason: v.reason, checked: true, mode: 'photo' }
  return {
    decision: v.confidence >= REJECT_CONFIDENCE ? 'reject' : 'uncertain',
    confidence: v.confidence, reason: v.reason, checked: true, mode: 'photo',
  }
}

async function reviewForm(intent: string, spec: ProofSpec, payload: ProofPayload): Promise<NotaryVerdict> {
  const key = FORM_API_KEY
  if (!key || key.startsWith('REPLACE')) return uncertain('form', 'form judge skipped — no key')
  const fields = payload.formData ?? {}

  try {
    const res = await fetch(FORM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: FORM_MODEL,
        messages: [{
          role: 'user',
          content:
            `A person was asked to complete this real-world task: "${intent}".\n` +
            (spec.instructions ? `Instructions: "${spec.instructions}".\n` : '') +
            `They submitted this form data as proof:\n${JSON.stringify(fields)}\n` +
            `Does this plausibly and meaningfully satisfy the task? Reject ONLY if it is clearly ` +
            `irrelevant, empty of meaning, placeholder/gibberish, or self-contradictory. Be lenient ` +
            `on exact values you cannot independently verify.\n` +
            `Respond ONLY as JSON: {"satisfies": true|false, "confidence": 0.0-1.0, "reason": "one short sentence"}`,
        }],
        temperature: 0,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return uncertain('form', `form judge unavailable (HTTP ${res.status})`)
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    if (!content) return uncertain('form', 'form judge returned no content')

    const parsed = extractJson(content)
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0))
    const reason = String(parsed.reason ?? '').slice(0, 200)
    if (parsed.satisfies) return { decision: 'accept', confidence, reason, checked: true, mode: 'form' }
    return {
      decision: confidence >= REJECT_CONFIDENCE ? 'reject' : 'uncertain',
      confidence, reason, checked: true, mode: 'form',
    }
  } catch {
    return uncertain('form', 'form judge error')
  }
}
