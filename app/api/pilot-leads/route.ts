import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { insertPilotLead } from '@/lib/db'
import { rateLimit, sameOrigin } from '@/lib/security'

const LeadSchema = z.object({
  company_name: z.string().trim().min(2).max(120),
  contact_name: z.string().trim().min(2).max(120),
  work_email: z.string().trim().email().max(200),
  use_case: z.string().trim().min(20).max(1500),
  launch_city: z.string().trim().min(2).max(120),
  estimated_locations: z.number().int().min(1).max(100000),
  timeline: z.enum(['this_month','this_quarter','exploring']),
  website: z.string().max(0).optional().default(''),
})

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'pilot-lead', 5)) return NextResponse.json({ error: 'Too many submissions' }, { status: 429 })
  const parsed = LeadSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Please complete every field with a valid work email' }, { status: 400 })
  const { website: _honeypot, ...lead } = parsed.data
  try {
    const created = await insertPilotLead(lead)
    return NextResponse.json({ received:true, reference:created.id }, { status:201, headers:{'Cache-Control':'no-store'} })
  } catch (error) {
    console.error('[pilot-lead] insert failed', error)
    return NextResponse.json({ error:'Pilot applications are temporarily unavailable' }, { status:503 })
  }
}
