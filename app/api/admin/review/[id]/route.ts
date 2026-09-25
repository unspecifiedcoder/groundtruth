import { NextRequest, NextResponse } from 'next/server'
import { getTask, transition, recordAuditEvent } from '@/lib/db'
import { settleTask } from '@/lib/settle'
import { constantTimeEqual, rateLimit, sameOrigin, verifyAdminSession } from '@/lib/security'

// Simple secret-based auth for admin endpoints
function isAuthorized(req: NextRequest): boolean {
  const configured = process.env.ADMIN_SECRET
  if (!configured) return false // no admin secret set → admin endpoints are closed
  return constantTimeEqual(configured, req.headers.get('x-admin-secret')) || verifyAdminSession(req.cookies.get('gt_admin')?.value)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const routeParams = await params
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'admin-review', 30)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { action?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action } = body
  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const task = await getTask(routeParams.id)
  if (!task || !['submitted', 'needs_review'].includes(task.status)) {
    return NextResponse.json({ error: 'Task not awaiting review' }, { status: 409 })
  }
  const reviewStatus = task.status as 'submitted' | 'needs_review'

  if (action === 'reject') {
    await transition(routeParams.id, reviewStatus, 'failed', {
      resolved_at: new Date().toISOString(),
    })
    await recordAuditEvent({ event_type: 'task.review_rejected', actor_type: 'operator', resource_type: 'task', resource_id: routeParams.id }).catch(() => {})
    return NextResponse.json({ task_id: routeParams.id, outcome: 'failed' })
  }

  // Approve — transition to verified then settle
  const verified = await transition(routeParams.id, reviewStatus, 'verified', {
    resolved_at: new Date().toISOString(),
  })
  if (!verified) {
    return NextResponse.json({ error: 'Transition failed' }, { status: 409 })
  }
  await recordAuditEvent({ event_type: 'task.review_approved', actor_type: 'operator', resource_type: 'task', resource_id: routeParams.id }).catch(() => {})

  const settleResult = await settleTask(
    routeParams.id,
    task.worker_wallet ?? '',
    task.payment_ref ?? '',
    task.budget_usdt
  )

  return NextResponse.json({
    task_id: routeParams.id,
    outcome: 'verified',
    settle: settleResult,
  })
}
