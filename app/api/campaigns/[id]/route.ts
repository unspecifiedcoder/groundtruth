import { NextRequest, NextResponse } from 'next/server'
import { getCampaignWithTasks } from '@/lib/db'
import { campaignTokenMatches } from '@/lib/campaign-auth'
import { campaignCookieName, rateLimit } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (await rateLimit(req, 'campaign-read', 120)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const token = req.cookies.get(campaignCookieName(params.id))?.value ?? ''
  const record = await getCampaignWithTasks(params.id)
  if (!record) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (!token || !campaignTokenMatches(record.campaign.access_token_hash, token)) {
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
  return NextResponse.json({ campaign, counts, tasks }, { headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } })
}
