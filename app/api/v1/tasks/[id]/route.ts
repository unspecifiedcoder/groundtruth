import { NextRequest, NextResponse } from 'next/server'
import { getTask } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await getTask(params.id)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Return safe public view — no payment_ref, no internal fields
    return NextResponse.json({
      id: task.id,
      intent: task.intent,
      proof_spec: task.proof_spec,
      budget_usdt: task.budget_usdt,
      status: task.status,
      result: task.result,
      created_at: task.created_at,
      expires_at: task.expires_at,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
