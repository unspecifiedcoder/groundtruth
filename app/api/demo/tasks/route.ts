import { NextRequest, NextResponse } from 'next/server'
import { consumeSponsoredDemoCredit } from '@/lib/demo-rate-limit'
import { createSponsoredSandboxTask, DEMO_COOKIE_NAME, type DemoScenario, verifyDemoSession } from '@/lib/demo-session'
import { rateLimit, sameOrigin } from '@/lib/security'

const scenarios = new Set<DemoScenario>(['retail_shelf_check', 'delivery_presence_check', 'equipment_condition_check'])

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'demo-task-create', 8)) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  const session = verifyDemoSession(req.cookies.get(DEMO_COOKIE_NAME)?.value)
  if (!session) return NextResponse.json({ error: 'Connect and verify a wallet to start the sponsored demo' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { scenario?: string }
  const scenario = (body.scenario ?? 'retail_shelf_check') as DemoScenario
  if (!scenarios.has(scenario)) return NextResponse.json({ error: 'Unsupported demo scenario' }, { status: 400 })

  const credit = await consumeSponsoredDemoCredit(session.wallet, session.sessionId)
  if (!credit.ok) {
    const status = credit.reason === 'already_used' ? 409 : 503
    const error = credit.reason === 'already_used'
      ? 'This wallet or demo session has already used its sponsored credit'
      : 'Sponsored demo credits are temporarily unavailable because durable replay protection is offline'
    return NextResponse.json({ error }, { status })
  }

  const { task, taskToken } = createSponsoredSandboxTask(session, scenario)
  return NextResponse.json({
    task,
    taskToken,
    disclosure: 'Sponsored sandbox demonstration. No USDC was charged and this task cannot authorize production work.',
  }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
