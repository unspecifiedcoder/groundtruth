import { NextResponse } from 'next/server'
import { readRobinhoodDemo } from '@/lib/robinhood-demo'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await readRobinhoodDemo(), {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' },
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Robinhood demo proof is temporarily unavailable',
      detail: error instanceof Error ? error.message : 'Unknown RPC error',
    }, { status: 503 })
  }
}
