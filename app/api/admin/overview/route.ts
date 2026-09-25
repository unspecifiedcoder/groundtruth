import { NextRequest, NextResponse } from 'next/server'
import { getAdminOperationsOverview } from '@/lib/db'
import { constantTimeEqual, rateLimit, verifyAdminSession } from '@/lib/security'

function authorized(req: NextRequest) {
  return constantTimeEqual(process.env.ADMIN_SECRET, req.headers.get('x-admin-secret')) || verifyAdminSession(req.cookies.get('gt_admin')?.value)
}

export async function GET(req: NextRequest) {
  if (await rateLimit(req, 'admin-overview', 30)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await getAdminOperationsOverview(), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[admin-overview]', error)
    return NextResponse.json({ error: 'Operations data is unavailable' }, { status: 503 })
  }
}
