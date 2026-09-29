import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { insertPilotLead } from '@/lib/db'
import { rateLimit, sameOrigin } from '@/lib/security'
import { getRetailPlan } from '@/lib/retail-plans'

const LeadSchema = z.object({
  company_name: z.string().trim().min(2).max(120),
  work_email: z.string().trim().email().max(200),
  launch_city: z.string().trim().min(2).max(120),
  cadence: z.enum(['launch_pilot', 'monthly_25', 'monthly_75', 'unsure']).optional().default('launch_pilot'),
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
  const { website: _honeypot, cadence, question_type, notes, source, campaign, prospect, ...input } = parsed.data
  const questionLabels = { stock: 'Is the SKU in stock?', price: 'What shelf price is displayed?', promotion: 'Is the promotion or display executed?', store_open: 'Is the store open?', other: 'Other retail verification question' }
  const plan = getRetailPlan(cadence)
  const lead = {
    ...input,
    contact_name: 'Not requested',
    use_case: `${questionLabels[question_type]}${notes ? `\n\n${notes}` : ''}`,
    question_type,
    cadence,
    notes,
    source,
    campaign,
    prospect,
    estimated_locations: plan.checks,
    timeline: plan.timeline,
  }
  try {
    const created = await insertPilotLead(lead)
    const commercialStep = cadence === 'unsure' ? 'Recommend the smallest useful scope' : `Send a ${plan.priceLabel} proposal after coverage approval`
    return NextResponse.json({ received: true, reference: created.id, selected_plan: cadence, next_steps: ['Confirm city zone', 'Agree evidence checklist', commercialStep] }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[pilot-lead] insert failed', error)
    return NextResponse.json({ error:'Pilot applications are temporarily unavailable' }, { status:503 })
  }
}
