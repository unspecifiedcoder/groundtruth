import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const localUses = new Map<string, number>()

function secret(): string {
  const value = process.env.DEMO_SESSION_SECRET ?? process.env.CLAIM_TOKEN_SECRET ?? process.env.ADMIN_SECRET
  if (!value) throw new Error('Demo signing secret is not configured')
  return value
}
function opaqueKey(scope: string, value: string): string {
  return `demo:${scope}:${createHmac('sha256', secret()).update(value.toLowerCase()).digest('hex')}`
}

async function consumeOnce(key: string, windowSeconds: number): Promise<'consumed' | 'used' | 'unavailable'> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && serviceKey) {
    try {
      const db = createClient(url, serviceKey, { auth: { persistSession: false } })
      const { data, error } = await db.rpc('check_api_rate_limit', { p_key: key, p_max: 1, p_window_seconds: windowSeconds })
      if (error) return 'unavailable'
      return data === true ? 'used' : 'consumed'
    } catch {
      return 'unavailable'
    }
  }

  // Local development fallback. Production must have durable Supabase-backed
  // replay protection; an in-memory map is not sufficient across serverless nodes.
  if (process.env.NODE_ENV === 'production') return 'unavailable'
  const now = Date.now()
  const previous = localUses.get(key)
  if (previous && now - previous < windowSeconds * 1000) return 'used'
  localUses.set(key, now)
  return 'consumed'
}

export async function consumeDemoChallenge(jti: string): Promise<boolean> {
  return (await consumeOnce(opaqueKey('challenge', jti), 5 * 60)) === 'consumed'
}

export async function consumeSponsoredDemoCredit(wallet: string, sessionId: string): Promise<{ ok: boolean; reason?: 'already_used' | 'unavailable' }> {
  const session = await consumeOnce(opaqueKey('session-credit', sessionId), 20 * 60)
  if (session !== 'consumed') return { ok: false, reason: session === 'used' ? 'already_used' : 'unavailable' }

  const walletUse = await consumeOnce(opaqueKey('wallet-credit', wallet), Number(process.env.DEMO_CREDIT_WINDOW_SECONDS ?? 86_400))
  if (walletUse !== 'consumed') return { ok: false, reason: walletUse === 'used' ? 'already_used' : 'unavailable' }
  return { ok: true }
}
