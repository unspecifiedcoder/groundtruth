import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updatePilotLeadStatus } from '@/lib/db'
import { constantTimeEqual, rateLimit, verifyAdminSession } from '@/lib/security'
import { LEAD_STATUSES } from '@/lib/sales-pipeline'

const StatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
  payment_reference: z.string().trim().min(3).max(240).optional(),
  amount_received_usd: z.number().positive().max(1_000_000).optional(),
}).superRefine((value, ctx) => {
  if ((value.status === 'paid' || value.status === 'active') && (!value.payment_reference || value.amount_received_usd === undefined)) {
    ctx.addIssue({ code: 'custom', message: 'Payment reference and received amount are required' })
  }
})

function authorized(req: NextRequest) {
  return constantTimeEqual(process.env.ADMIN_SECRET, req.headers.get('x-admin-secret')) || verifyAdminSession(req.cookies.get('gt_admin')?.value)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (await rateLimit(req, 'admin-pilot-lead', 40)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = StatusSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid lead status' }, { status: 400 })
  const { id } = await params
  try {
    const evidence = parsed.data.payment_reference && parsed.data.amount_received_usd !== undefined
      ? { reference: parsed.data.payment_reference, amountUsd: parsed.data.amount_received_usd }
      : undefined
    const result = await updatePilotLeadStatus(id, parsed.data.status, evidence)
    if (!result.updated) {
      if (result.reason === 'not_found') return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      const messages = {
        invalid_transition: 'That sales-stage transition is not allowed',
        payment_evidence_required: 'Payment reference and received amount are required',
        recurring_plan_required: 'Only a recurring-plan lead can become an active subscription',
      }
      return NextResponse.json({ error: messages[result.reason] }, { status: 409 })
    }
    return NextResponse.json({ updated: true, status: parsed.data.status }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[pilot-lead-status]', error)
    return NextResponse.json({ error: 'Could not update lead' }, { status: 503 })
  }
}
