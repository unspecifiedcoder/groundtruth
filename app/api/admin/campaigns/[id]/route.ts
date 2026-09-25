import { NextRequest, NextResponse } from 'next/server'
import { controlCampaign, recordAuditEvent } from '@/lib/db'
import { constantTimeEqual, rateLimit, sameOrigin, verifyAdminSession } from '@/lib/security'

function authorized(req: NextRequest) {
  return constantTimeEqual(process.env.ADMIN_SECRET, req.headers.get('x-admin-secret')) || verifyAdminSession(req.cookies.get('gt_admin')?.value)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'admin-campaign-control', 20)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as { action?: 'cancel' | 'complete' }
  if (body.action !== 'cancel' && body.action !== 'complete') return NextResponse.json({ error: 'Action must be cancel or complete' }, { status: 400 })
  try {
    const result = await controlCampaign(id, body.action)
    if (!result.changed) return NextResponse.json({ error: `Campaign still has ${result.open_tasks} open tasks` }, { status: 409 })
    await recordAuditEvent({ event_type: body.action === 'cancel' ? 'campaign.cancelled' : 'campaign.completed', actor_type: 'operator', resource_type: 'campaign', resource_id: id, metadata: { open_tasks_at_action: result.open_tasks } }).catch(() => {})
    return NextResponse.json({ campaign_id: id, status: body.action === 'cancel' ? 'cancelled' : 'completed', open_tasks_at_action: result.open_tasks })
  } catch (error) {
    console.error('[admin-campaign-control]', error)
    return NextResponse.json({ error: 'Campaign control failed' }, { status: 500 })
  }
}
