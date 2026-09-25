import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const WINDOW_MS = 60_000
const buckets = new Map<string, number[]>()

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

/** Best-effort local limiter. Production deployments can set RATE_LIMIT_BYPASS
 * only behind a managed edge/WAF limiter; otherwise this remains a safe
 * per-instance backstop. */
function localRateLimit(req: NextRequest, scope: string, max: number): boolean {
  if (process.env.RATE_LIMIT_BYPASS === 'true') return false
  const now = Date.now()
  const key = `${scope}:${clientIp(req)}`
  const active = (buckets.get(key) ?? []).filter(hit => now - hit < WINDOW_MS)
  active.push(now)
  buckets.set(key, active)
  return active.length > max
}

export async function rateLimit(req: NextRequest, scope: string, max: number): Promise<boolean> {
  if (localRateLimit(req, scope, max)) return true
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false
  try {
    const identifier = createHmac('sha256', signingSecret()).update(`${scope}:${clientIp(req)}`).digest('hex')
    const db = createClient(url, key, { auth: { persistSession: false } })
    const { data, error } = await db.rpc('check_api_rate_limit', { p_key: identifier, p_max: max, p_window_seconds: 60 })
    return error ? false : data === true
  } catch {
    return false
  }
}

export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // server-to-server and CLI requests do not set Origin
  try {
    const originHost = new URL(origin).host
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
    return !!requestHost && originHost === requestHost
  } catch {
    return false
  }
}

export function constantTimeEqual(expected: string | undefined, supplied: string | null | undefined): boolean {
  if (!expected || !supplied) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(supplied)
  return a.length === b.length && timingSafeEqual(a, b)
}

function signingSecret(): string {
  const secret = process.env.CLAIM_TOKEN_SECRET ?? process.env.ADMIN_SECRET
  if (!secret) throw new Error('CLAIM_TOKEN_SECRET is not configured')
  return secret
}

function sign(value: string): string {
  return createHmac('sha256', signingSecret()).update(value).digest('base64url')
}

function issueSignedPayload(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

function readSignedPayload<T>(token: string): T | null {
  try {
    const [payload, signature, extra] = token.split('.')
    if (!payload || !signature || extra || !constantTimeEqual(sign(payload), signature)) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T
  } catch { return null }
}

export function issueClaimToken(taskId: string, wallet: string, ttlSeconds = 3600): string {
  return issueSignedPayload({ taskId, wallet: wallet.toLowerCase(), exp: Math.floor(Date.now() / 1000) + ttlSeconds })
}

export function verifyClaimToken(token: string, taskId: string, wallet: string): boolean {
  try {
    const decoded = readSignedPayload<{ taskId?: string; wallet?: string; exp?: number }>(token)
    if (!decoded) return false
    return decoded.taskId === taskId
      && decoded.wallet === wallet.toLowerCase()
      && typeof decoded.exp === 'number'
      && decoded.exp >= Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export function issueWalletChallenge(wallet: string): { message: string; token: string } {
  const nonce = crypto.randomUUID()
  const exp = Math.floor(Date.now() / 1000) + 5 * 60
  const message = `GroundTruth wallet verification\n\nWallet: ${wallet.toLowerCase()}\nNonce: ${nonce}\nExpires: ${new Date(exp * 1000).toISOString()}\n\nThis signature does not authorize a transaction.`
  return { message, token: issueSignedPayload({ type: 'wallet_challenge', wallet: wallet.toLowerCase(), nonce, exp, message }) }
}

export function verifyWalletChallengeToken(token: string, wallet: string, message: string): boolean {
  const payload = readSignedPayload<{ type?: string; wallet?: string; exp?: number; message?: string }>(token)
  return !!payload && payload.type === 'wallet_challenge' && payload.wallet === wallet.toLowerCase() && payload.message === message && !!payload.exp && payload.exp >= Math.floor(Date.now() / 1000)
}

export function issueWalletSession(wallet: string): string {
  return issueSignedPayload({ type: 'wallet_session', wallet: wallet.toLowerCase(), exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60 })
}

export function verifyWalletSession(token: string | undefined, wallet: string): boolean {
  if (!token) return false
  const payload = readSignedPayload<{ type?: string; wallet?: string; exp?: number }>(token)
  return !!payload && payload.type === 'wallet_session' && payload.wallet === wallet.toLowerCase() && !!payload.exp && payload.exp >= Math.floor(Date.now() / 1000)
}

export function issueAdminSession(): string {
  return issueSignedPayload({ type: 'admin_session', exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60 })
}

export function verifyAdminSession(token: string | undefined): boolean {
  if (!token) return false
  const payload = readSignedPayload<{ type?: string; exp?: number }>(token)
  return !!payload && payload.type === 'admin_session' && !!payload.exp && payload.exp >= Math.floor(Date.now() / 1000)
}

export function campaignCookieName(campaignId: string): string {
  return `gt_campaign_${campaignId.replace(/[^a-zA-Z0-9-]/g, '')}`
}
