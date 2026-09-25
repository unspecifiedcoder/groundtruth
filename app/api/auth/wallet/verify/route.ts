import { NextRequest, NextResponse } from 'next/server'
import { isAddress, verifyMessage } from 'viem'
import { issueWalletSession, rateLimit, sameOrigin, verifyWalletChallengeToken } from '@/lib/security'

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'wallet-verify', 15)) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  const body = await req.json().catch(() => ({})) as { wallet?: string; message?: string; challenge_token?: string; signature?: `0x${string}` }
  if (!body.wallet || !isAddress(body.wallet) || !body.message || !body.challenge_token || !body.signature) return NextResponse.json({ error: 'Missing verification fields' }, { status: 400 })
  if (!verifyWalletChallengeToken(body.challenge_token, body.wallet, body.message)) return NextResponse.json({ error: 'Challenge expired or invalid' }, { status: 401 })
  const valid = await verifyMessage({ address: body.wallet, message: body.message, signature: body.signature }).catch(() => false)
  if (!valid) return NextResponse.json({ error: 'Signature does not match wallet' }, { status: 401 })
  const response = NextResponse.json({ verified: true, wallet: body.wallet.toLowerCase() })
  response.cookies.set('gt_worker', issueWalletSession(body.wallet), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 12 * 60 * 60 })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
