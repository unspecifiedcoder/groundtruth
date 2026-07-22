import type { VisionResult } from './types'

// Real AI-vision content check: does the submitted photo actually show what the
// task asked for? Uses a Groq vision model. This is ADVISORY — a mismatch flags
// a red alert on the result but never blocks settlement (hackathon flow keeps
// moving). It also fails OPEN: any error/missing key → checked:false, match:true,
// so verification never breaks on an infra hiccup.

// Provider-flexible: any OpenAI-compatible vision endpoint works via env —
// Groq (Llama-4), OpenAI (gpt-4o-mini), OpenRouter, Gemini's OpenAI shim, etc.
// Defaults to Groq; override VISION_API_URL / VISION_API_KEY / VISION_MODEL.
const API_URL = process.env.VISION_API_URL ?? 'https://api.groq.com/openai/v1/chat/completions'
const API_KEY = process.env.VISION_API_KEY ?? process.env.GROQ_API_KEY
const MODEL = process.env.VISION_MODEL ?? process.env.GROQ_VISION_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct'

// Thinking models (e.g. Gemini flash) spend tokens reasoning before the answer,
// so a small budget truncates the JSON. Give room; override per-provider.
const MAX_TOKENS = Number(process.env.VISION_MAX_TOKENS ?? '1200')

const skipped = (reason: string): VisionResult => ({ checked: false, match: true, confidence: 0, reason })

// Providers differ: some return raw JSON, Gemini wraps it in ```json fences and
// may add prose. Extract the first {...} object robustly.
export function extractJson(s: string): any {
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fence ? fence[1] : s
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('no json object in response')
  return JSON.parse(body.slice(start, end + 1))
}

export async function verifyImageMatchesIntent(dataUrl: string, intent: string, challenge?: string): Promise<VisionResult> {
  const key = API_KEY
  if (!key || key.startsWith('REPLACE')) return skipped('vision skipped — no vision API key')

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  `A person was asked to complete this real-world task: "${intent}".\n` +
                  `Look at the image they submitted as proof. Does its CONTENT plausibly show that task being done?\n` +
                  `Judge the subject matter only — be lenient on framing, quality, and medium (photo, ` +
                  `screenshot, or graphic all count). Reject only if the content clearly does not match the task.\n` +
                  (challenge
                    ? `ALSO: a freshness code was issued for this task. Is the exact text "${challenge}" clearly ` +
                      `written or visible somewhere in the image (e.g. on a note held in frame)? Set "challenge_visible" accordingly.\n`
                    : '') +
                  `Respond ONLY as JSON: {"match": true|false, ${challenge ? '"challenge_visible": true|false, ' : ''}"confidence": 0.0-1.0, "reason": "one short sentence"}`,
              },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0,
        max_tokens: MAX_TOKENS,
      }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) return skipped(`vision unavailable (HTTP ${res.status})`)
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    if (!content) return skipped('vision returned no content')

    const parsed = extractJson(content)
    return {
      checked: true,
      match: !!parsed.match,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      reason: String(parsed.reason ?? '').slice(0, 200),
      challengeFound: challenge ? !!parsed.challenge_visible : undefined,
    }
  } catch {
    return skipped('vision error')
  }
}
