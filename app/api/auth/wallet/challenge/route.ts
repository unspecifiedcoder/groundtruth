import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { issueWalletChallenge, rateLimit, sameOrigin } from '@/lib/security'

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'wallet-challenge', 15)) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  const body = await req.json().catch(() => ({})) as { wallet?: string }
  if (!body.wallet || !isAddress(body.wallet)) return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 })
  return NextResponse.json(issueWalletChallenge(body.wallet), { headers: { 'Cache-Control': 'no-store' } })
}
