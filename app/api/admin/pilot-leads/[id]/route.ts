import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updatePilotLeadStatus } from '@/lib/db'
import { constantTimeEqual, rateLimit, verifyAdminSession } from '@/lib/security'

const StatusSchema = z.object({ status: z.enum(['new', 'qualified', 'scope_sent', 'payment_pending', 'paid', 'declined']) })

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
    const changed = await updatePilotLeadStatus(id, parsed.data.status)
    if (!changed) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    return NextResponse.json({ updated: true, status: parsed.data.status }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[pilot-lead-status]', error)
    return NextResponse.json({ error: 'Could not update lead' }, { status: 503 })
  }
}
