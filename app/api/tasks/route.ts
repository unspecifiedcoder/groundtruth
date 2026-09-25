import { NextRequest, NextResponse } from 'next/server'
import { listOpenTasks } from '@/lib/db'
import { rateLimit } from '@/lib/security'

export async function GET(req: NextRequest) {
  try {
    if (await rateLimit(req, 'task-board', 120)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    const tasks = await listOpenTasks()
    const safe = tasks.map(task => ({
      id: task.id,
      intent: task.intent,
      proof_spec: {
        ...task.proof_spec,
        challenge: undefined,
        ...(task.proof_spec.location ? { location: { label: task.proof_spec.location.label, radius_meters: task.proof_spec.location.radius_meters, coordinates_redacted: true } } : {}),
      },
      budget_usdt: task.budget_usdt,
      status: task.status,
      created_at: task.created_at,
      expires_at: task.expires_at,
    }))
    return NextResponse.json(safe, { headers: { 'Cache-Control': 'public, max-age=10, stale-while-revalidate=20' } })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}
