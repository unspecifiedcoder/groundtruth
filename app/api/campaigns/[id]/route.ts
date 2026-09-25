import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { getCampaignWithTasks } from '@/lib/db'

export const dynamic = 'force-dynamic'

function equalHash(expected: string, token: string): boolean {
  const actual = createHash('sha256').update(token).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(actual)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.nextUrl.searchParams.get('key') ?? ''
  const record = await getCampaignWithTasks(params.id)
  if (!record) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (!token || !equalHash(record.campaign.access_token_hash, token)) {
    return NextResponse.json({ error: 'Invalid campaign access token' }, { status: 401 })
  }

  const tasks = record.tasks.map(task => ({
    id: task.id,
    intent: task.intent,
    location: task.proof_spec.location?.label ?? null,
    sku: (task.proof_spec as typeof task.proof_spec & { campaign?: { sku?: string } }).campaign?.sku ?? null,
    status: task.status,
    budget_usdt: task.budget_usdt,
    created_at: task.created_at,
    expires_at: task.expires_at,
    result: task.result,
    answers: task.proof_payload?.formData ?? null,
    receipt_url: `/receipts/${task.id}`,
  }))
  const counts = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1
    return acc
  }, {})

  const { access_token_hash: _private, ...campaign } = record.campaign
  return NextResponse.json({ campaign, counts, tasks })
}
