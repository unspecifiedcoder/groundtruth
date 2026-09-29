import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateOperatorApplicationStatus } from '@/lib/db'
import { validateOperatorCalibration } from '@/lib/operator-calibration'
import { constantTimeEqual, rateLimit, verifyAdminSession } from '@/lib/security'

const CalibrationSchema = z.object({
  calibration_reference: z.string().trim().min(3).max(160),
  payment_reference: z.string().trim().min(3).max(160),
  payment_amount_inr: z.number().finite().min(180),
  fresh_capture_pass: z.boolean(),
  location_pass: z.boolean(),
  checklist_pass: z.boolean(),
  safety_pass: z.boolean(),
  manual_review_pass: z.boolean(),
  payout_identity_verified: z.boolean(),
})

const DecisionSchema = z.object({
  status: z.enum(['shortlisted', 'calibration_scheduled', 'active', 'paused', 'rejected']),
  calibration: CalibrationSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.status !== 'active') return
  const error = validateOperatorCalibration(data.calibration)
  if (error) ctx.addIssue({ code: 'custom', path: ['calibration'], message: error })
})

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
    const result = await updateOperatorApplicationStatus(id, parsed.data.status, parsed.data.calibration)
    if (result === 'not_found') return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    if (result === 'invalid_transition') return NextResponse.json({ error: 'Invalid operator status transition' }, { status: 409 })
    if (result === 'invalid_calibration') return NextResponse.json({ error: 'Complete paid calibration evidence is required before activation' }, { status: 409 })
    return NextResponse.json({ updated: true, status: parsed.data.status }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[operator-application-decision]', error)
    return NextResponse.json({ error: 'Could not update application' }, { status: 503 })
  }
}
