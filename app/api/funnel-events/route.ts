import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { insertFunnelEvent } from '@/lib/db'
import { rateLimit, sameOrigin } from '@/lib/security'

const FunnelEventSchema = z.object({
  event: z.literal('pilot_landing'),
  source: z.string().trim().min(1).max(80),
  campaign: z.string().trim().max(120).optional().default(''),
  prospect: z.string().trim().max(120).optional().default(''),
})

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'funnel-event', 20)) return NextResponse.json({ error: 'Too many events' }, { status: 429 })
  const parsed = FunnelEventSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid event' }, { status: 400 })

  try {
    await insertFunnelEvent(parsed.data)
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[funnel-event] insert failed', error)
    return NextResponse.json({ error: 'Event unavailable' }, { status: 503 })
  }
}
