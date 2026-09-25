import { NextRequest, NextResponse } from 'next/server'
import { getTask, recordAuditEvent } from '@/lib/db'
import { settleTask } from '@/lib/settle'
import { hasSettlementContract } from '@/lib/chain'
import { constantTimeEqual, rateLimit, sameOrigin, verifyAdminSession } from '@/lib/security'

function authorized(req: NextRequest) {
  return constantTimeEqual(process.env.ADMIN_SECRET, req.headers.get('x-admin-secret')) || verifyAdminSession(req.cookies.get('gt_admin')?.value)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'admin-settlement-retry', 10)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const task = await getTask(id)
  if (!task || task.status !== 'verified' || !task.worker_wallet) return NextResponse.json({ error: 'Task is not eligible for settlement retry' }, { status: 409 })
  const contractAddress = (process.env.PAYROLL_CONTRACT_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`
  if (!(await hasSettlementContract(contractAddress))) return NextResponse.json({ error: 'Automatic retry is disabled because this settlement path has no idempotent payroll contract. Reconcile it manually to avoid a duplicate transfer.' }, { status: 409 })
  await recordAuditEvent({ event_type: 'payment.retry_requested', actor_type: 'operator', resource_type: 'payment', resource_id: id }).catch(() => {})
  const result = await settleTask(task.id, task.worker_wallet, task.payment_ref ?? '', task.budget_usdt)
  await recordAuditEvent({ event_type: result.success ? 'payment.retry_succeeded' : 'payment.retry_failed', actor_type: 'system', resource_type: 'payment', resource_id: id, metadata: { error: result.error ?? null, tx_hash: result.txHash ?? null } }).catch(() => {})
  return NextResponse.json(result, { status: result.success ? 200 : 503 })
}
