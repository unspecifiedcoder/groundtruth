import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { insertPilotLead } from '@/lib/db'
import { rateLimit, sameOrigin } from '@/lib/security'

const LeadSchema = z.object({
  company_name: z.string().trim().min(2).max(120),
  work_email: z.string().trim().email().max(200),
  launch_city: z.string().trim().min(2).max(120),
  question_type: z.enum(['stock', 'price', 'promotion', 'store_open', 'other']),
  notes: z.string().trim().max(1000).optional().default(''),
  website: z.string().max(0).optional().default(''),
  source: z.string().trim().min(1).max(80).optional().default('website'),
  campaign: z.string().trim().max(120).optional().default(''),
  prospect: z.string().trim().max(120).optional().default(''),
})

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'pilot-lead', 5)) return NextResponse.json({ error: 'Too many submissions' }, { status: 429 })
  const parsed = LeadSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Please complete every field with a valid work email' }, { status: 400 })
  const { website: _honeypot, question_type, notes, source, campaign, prospect, ...input } = parsed.data
  const questionLabels = { stock: 'Is the SKU in stock?', price: 'What shelf price is displayed?', promotion: 'Is the promotion or display executed?', store_open: 'Is the store open?', other: 'Other retail verification question' }
  const lead = {
    ...input,
    contact_name: 'Not requested',
    use_case: `${questionLabels[question_type]}${notes ? `\n\n${notes}` : ''}`,
    question_type,
    notes,
    source,
    campaign,
    prospect,
    estimated_locations: 25,
    timeline: 'coverage_request',
  }
  try {
    const created = await insertPilotLead(lead)
    return NextResponse.json({ received: true, reference: created.id, next_steps: ['Confirm city zone', 'Agree evidence checklist', 'Send launch date and $199 payment instructions'] }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[pilot-lead] insert failed', error)
    return NextResponse.json({ error:'Pilot applications are temporarily unavailable' }, { status:503 })
  }
}
