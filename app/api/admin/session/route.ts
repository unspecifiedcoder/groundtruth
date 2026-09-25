import { NextRequest, NextResponse } from 'next/server'
import { constantTimeEqual, issueAdminSession, rateLimit, sameOrigin } from '@/lib/security'

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'admin-session', 8)) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  const body = await req.json().catch(() => ({})) as { secret?: string }
  if (!constantTimeEqual(process.env.ADMIN_SECRET, body.secret)) return NextResponse.json({ error: 'Invalid operations key' }, { status: 401 })
  const response = NextResponse.json({ authenticated: true })
  response.cookies.set('gt_admin', issueAdminSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/admin', maxAge: 8 * 60 * 60 })
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false })
  response.cookies.set('gt_admin', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/admin', maxAge: 0 })
  return response
}
