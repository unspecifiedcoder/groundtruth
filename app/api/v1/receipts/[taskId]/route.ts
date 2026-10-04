import { NextRequest, NextResponse } from 'next/server'
import { readEvidenceReceipt } from '@/lib/evidence-receipt'
import { rateLimit } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  if (await rateLimit(req, 'receipt-status', 120)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const { taskId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(taskId)) return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
  try {
    const receipt = await readEvidenceReceipt(taskId)
    if (!receipt) return NextResponse.json({ error: 'Receipt registry is not configured' }, { status: 503 })
    return NextResponse.json(receipt, { headers: { 'Cache-Control': 'public, max-age=30' } })
  } catch (error) {
    return NextResponse.json({ error: 'Receipt lookup failed', detail: error instanceof Error ? error.message : String(error) }, { status: 502 })
  }
}
