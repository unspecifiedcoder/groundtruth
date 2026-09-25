import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { constantTimeEqual, rateLimit, verifyAdminSession } from '@/lib/security'
import { createProofUrls } from '@/lib/db'

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret')
  return constantTimeEqual(process.env.ADMIN_SECRET, secret) || verifyAdminSession(req.cookies.get('gt_admin')?.value)
}

export async function GET(req: NextRequest) {
  if (await rateLimit(req, 'admin-queue', 30)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json([], { status: 200 })

  const db = createClient(url, key, { auth: { persistSession: false } })
  const { data } = await db
    .from('tasks')
    .select('id, intent, worker_wallet, budget_usdt, submitted_at, proof_payload')
    .in('status', ['submitted', 'needs_review'])
    .order('submitted_at', { ascending: true })

  const enriched = await Promise.all((data ?? []).map(async task => ({
    ...task,
    evidence_urls: await createProofUrls((task.proof_payload as { storageKeys?: string[] } | null)?.storageKeys ?? [], 900),
    proof_payload: task.proof_payload ? { ...(task.proof_payload as object), storageKeys: undefined, location: undefined } : null,
  })))
  return NextResponse.json(enriched, { headers: { 'Cache-Control': 'private, no-store' } })
}
