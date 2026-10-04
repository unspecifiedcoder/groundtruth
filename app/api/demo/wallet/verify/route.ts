import { NextRequest, NextResponse } from 'next/server'
import { isAddress, verifyMessage } from 'viem'
import { consumeDemoChallenge } from '@/lib/demo-rate-limit'
import { DEMO_COOKIE_NAME, DEMO_SESSION_TTL_SECONDS, issueDemoSession, verifyDemoWalletChallenge } from '@/lib/demo-session'
import { rateLimit, sameOrigin } from '@/lib/security'

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'demo-wallet-verify', 10)) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  const body = await req.json().catch(() => ({})) as {
    wallet?: string; message?: string; challengeToken?: string; signature?: `0x${string}`
  }
  if (!body.wallet || !isAddress(body.wallet) || !body.message || !body.challengeToken || !body.signature) {
    return NextResponse.json({ error: 'Missing wallet verification fields' }, { status: 400 })
  }
  const challenge = verifyDemoWalletChallenge(body.challengeToken, body.wallet, body.message)
  if (!challenge) return NextResponse.json({ error: 'Challenge expired or invalid' }, { status: 401 })
  const valid = await verifyMessage({ address: body.wallet, message: body.message, signature: body.signature }).catch(() => false)
  if (!valid) return NextResponse.json({ error: 'Signature does not match wallet' }, { status: 401 })
  if (!await consumeDemoChallenge(challenge.jti)) return NextResponse.json({ error: 'Challenge was already used or replay protection is unavailable' }, { status: 409 })

  const { token, session } = issueDemoSession(body.wallet)
  const response = NextResponse.json({
    authenticated: true,
    wallet: session.wallet,
    session: { expiresAt: new Date(session.exp * 1000).toISOString(), sponsoredCredits: 1, environment: 'sandbox', productionAuthorized: false },
  })
  response.cookies.set(DEMO_COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
    path: '/api/demo', maxAge: DEMO_SESSION_TTL_SECONDS,
  })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
