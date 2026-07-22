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

const skipped = (reason: string): VisionResult => ({ checked: false, match: true, confidence: 0, reason })

export async function verifyImageMatchesIntent(dataUrl: string, intent: string): Promise<VisionResult> {
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
                  `Look at the photo they submitted as proof. Does it plausibly show that task being done?\n` +
                  `Be lenient on framing/quality; judge the subject matter. Respond ONLY as JSON: ` +
                  `{"match": true|false, "confidence": 0.0-1.0, "reason": "one short sentence"}`,
              },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) return skipped(`vision unavailable (HTTP ${res.status})`)
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    if (!content) return skipped('vision returned no content')

    const parsed = JSON.parse(content)
    return {
      checked: true,
      match: !!parsed.match,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      reason: String(parsed.reason ?? '').slice(0, 200),
    }
  } catch {
    return skipped('vision error')
  }
}
