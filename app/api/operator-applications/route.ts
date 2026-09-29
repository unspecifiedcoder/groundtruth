import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { insertOperatorApplication } from '@/lib/db'
import { rateLimit, sameOrigin } from '@/lib/security'

const ApplicationSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(2).max(120),
  locality: z.string().trim().min(2).max(160),
  languages: z.string().trim().min(2).max(300),
  transport: z.enum(['walk_transit', 'bicycle', 'two_wheeler', 'car', 'other']),
  availability: z.enum(['weekdays', 'evenings', 'weekends', 'flexible']),
  experience: z.string().trim().max(1000),
  source: z.string().trim().max(120).optional().default('organic'),
  campaign: z.string().trim().max(120).optional().default(''),
  prospect: z.string().trim().max(160).optional().default(''),
  website: z.string().max(0).optional().default(''),
})

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'operator-application', 4)) return NextResponse.json({ error: 'Too many submissions' }, { status: 429 })
  const parsed = ApplicationSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Please complete every required field with valid contact details' }, { status: 400 })
  const { website: _honeypot, ...application } = parsed.data
  try {
    const created = await insertOperatorApplication(application)
    return NextResponse.json({ received: true, reference: created.id }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[operator-application] insert failed', error)
    return NextResponse.json({ error: 'Applications are temporarily unavailable' }, { status: 503 })
  }
}
