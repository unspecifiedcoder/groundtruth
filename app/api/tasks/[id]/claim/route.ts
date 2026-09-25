import { NextRequest, NextResponse } from 'next/server'
import { claimTask, recordAuditEvent } from '@/lib/db'
import { issueClaimToken, rateLimit, sameOrigin, verifyWalletSession } from '@/lib/security'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const routeParams = await params
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'task-claim', 20)) return NextResponse.json({ error: 'Too many claim attempts' }, { status: 429 })
  let body: { worker_wallet?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { worker_wallet } = body
  if (!worker_wallet?.match(/^0x[0-9a-fA-F]{40}$/)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
  }
  if (process.env.REQUIRE_WALLET_SIGNATURE === 'true' && !verifyWalletSession(req.cookies.get('gt_worker')?.value, worker_wallet)) {
    return NextResponse.json({ error: 'Verify control of this wallet before claiming a mission' }, { status: 401 })
  }

  const claimExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 min to complete
  const task = await claimTask(routeParams.id, worker_wallet, claimExpiry)

  if (!task) {
    return NextResponse.json(
      { error: 'Task not available — already claimed or expired' },
      { status: 409 }
    )
  }

  const ttl = Math.max(60, Math.min(3600, Math.floor((new Date(task.expires_at).getTime() - Date.now()) / 1000)))
  await recordAuditEvent({ event_type: 'task.claimed', actor_type: 'worker', actor_ref: worker_wallet.toLowerCase(), resource_type: 'task', resource_id: task.id }).catch(() => {})
  return NextResponse.json({ task_id: task.id, status: task.status, expires_at: task.expires_at, claim_token: issueClaimToken(task.id, worker_wallet, ttl) }, { headers: { 'Cache-Control': 'no-store' } })
}
