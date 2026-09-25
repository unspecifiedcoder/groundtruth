import { NextRequest, NextResponse } from 'next/server'
import { getCampaignWithTasks } from '@/lib/db'
import { campaignTokenMatches } from '@/lib/campaign-auth'
import { campaignCookieName, rateLimit, sameOrigin } from '@/lib/security'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'campaign-session', 12)) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  let token = ''
  try { token = String((await req.json()).token ?? '') } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const record = await getCampaignWithTasks(params.id)
  if (!record) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (!token || !campaignTokenMatches(record.campaign.access_token_hash, token)) return NextResponse.json({ error: 'Invalid campaign access token' }, { status: 401 })

  const response = NextResponse.json({ authenticated: true })
  response.cookies.set(campaignCookieName(params.id), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: Math.max(60, Math.min(7 * 24 * 60 * 60, Math.floor((new Date(record.campaign.expires_at).getTime() - Date.now()) / 1000))),
  })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
