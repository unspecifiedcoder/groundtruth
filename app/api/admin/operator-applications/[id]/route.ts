import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateOperatorApplicationStatus } from '@/lib/db'
import { constantTimeEqual, rateLimit, verifyAdminSession } from '@/lib/security'

const DecisionSchema = z.object({ status: z.enum(['shortlisted', 'calibration_scheduled', 'active', 'paused', 'rejected']) })

function authorized(req: NextRequest) {
  return constantTimeEqual(process.env.ADMIN_SECRET, req.headers.get('x-admin-secret')) || verifyAdminSession(req.cookies.get('gt_admin')?.value)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (await rateLimit(req, 'admin-operator-application', 30)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = DecisionSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
  const { id } = await params
  try {
    const result = await updateOperatorApplicationStatus(id, parsed.data.status)
    if (result === 'not_found') return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    if (result === 'invalid_transition') return NextResponse.json({ error: 'Invalid operator status transition' }, { status: 409 })
    return NextResponse.json({ updated: true, status: parsed.data.status }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[operator-application-decision]', error)
    return NextResponse.json({ error: 'Could not update application' }, { status: 503 })
  }
}
