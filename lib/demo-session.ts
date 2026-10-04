import { createHmac, timingSafeEqual } from 'crypto'
import { getAddress, isAddress } from 'viem'

export const DEMO_COOKIE_NAME = 'gt_demo_session'
export const DEMO_SESSION_AUDIENCE = 'groundtruth:sponsored-sandbox'
export const DEMO_SESSION_TTL_SECONDS = 15 * 60

type DemoChallenge = {
  type: 'demo_wallet_challenge'
  aud: typeof DEMO_SESSION_AUDIENCE
  wallet: `0x${string}`
  jti: string
  message: string
  exp: number
}
export type DemoSession = {
  type: 'demo_session'
  aud: typeof DEMO_SESSION_AUDIENCE
  wallet: `0x${string}`
  sessionId: string
  sponsoredCredits: 1
  productionAuthorized: false
  exp: number
}

export type DemoScenario = 'retail_shelf_check' | 'delivery_presence_check' | 'equipment_condition_check'

export type SponsoredSandboxTask = {
  type: 'sponsored_sandbox_task'
  environment: 'sandbox'
  productionAuthorized: false
  taskId: string
  wallet: `0x${string}`
  sessionId: string
  scenario: DemoScenario
  intent: string
  evidence: {
    type: 'photo'
    minPhotos: 1
    relaxedDemoChecks: true
    instructions: string
  }
  payment: {
    mode: 'sponsored_demo_credit'
    charged: false
    amount: '0.00'
    currency: 'USDC'
    transactionHash: null
  }
  createdAt: string
  expiresAt: string
}

const scenarioCopy: Record<DemoScenario, Pick<SponsoredSandboxTask, 'intent' | 'evidence'>> = {
  retail_shelf_check: {
    intent: 'Check whether a product is visible on a shelf and report the displayed price.',
    evidence: {
      type: 'photo', minPhotos: 1, relaxedDemoChecks: true,
      instructions: 'Upload or capture one shelf image. The sandbox checks file validity and task association; it does not claim production-grade physical verification.',
    },
  },
  delivery_presence_check: {
    intent: 'Check whether a delivery appears at the specified drop-off point.',
    evidence: {
      type: 'photo', minPhotos: 1, relaxedDemoChecks: true,
      instructions: 'Upload or capture one delivery image. The sandbox checks file validity and task association; it does not claim production-grade physical verification.',
    },
  },
  equipment_condition_check: {
    intent: 'Record the visible condition of a piece of equipment before an automated decision.',
    evidence: {
      type: 'photo', minPhotos: 1, relaxedDemoChecks: true,
      instructions: 'Upload or capture one equipment image. The sandbox checks file validity and task association; it does not claim production-grade physical verification.',
    },
  },
}

function demoSecret(): string {
  const value = process.env.DEMO_SESSION_SECRET ?? process.env.CLAIM_TOKEN_SECRET ?? process.env.ADMIN_SECRET
  if (!value) throw new Error('DEMO_SESSION_SECRET or CLAIM_TOKEN_SECRET is not configured')
  return value
}

function mac(value: string): string {
  return createHmac('sha256', demoSecret()).update(`demo.v1.${value}`).digest('base64url')
}

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function sign(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${mac(body)}`
}

function decode<T>(token: string): T | null {
  try {
    const [body, signature, extra] = token.split('.')
    if (!body || !signature || extra || !equal(mac(body), signature)) return null
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T
  } catch {
    return null
  }
}

function normalizedWallet(wallet: string): `0x${string}` | null {
  if (!isAddress(wallet)) return null
  return getAddress(wallet).toLowerCase() as `0x${string}`
}

export function issueDemoWalletChallenge(wallet: string, now = Date.now()): { message: string; challengeToken: string; expiresAt: string } {
  const normalized = normalizedWallet(wallet)
  if (!normalized) throw new Error('Invalid wallet')
  const jti = crypto.randomUUID()
  const exp = Math.floor(now / 1000) + 5 * 60
  const expiresAt = new Date(exp * 1000).toISOString()
  const message = [
    'GroundTruth sponsored sandbox',
    '',
    `Wallet: ${normalized}`,
    `Nonce: ${jti}`,
    `Expires: ${expiresAt}`,
    '',
    'This signature proves wallet ownership only.',
    'It does not authorize a payment, transaction, production task, or token approval.',
  ].join('\n')
  const payload: DemoChallenge = { type: 'demo_wallet_challenge', aud: DEMO_SESSION_AUDIENCE, wallet: normalized, jti, message, exp }
  return { message, challengeToken: sign(payload), expiresAt }
}

export function verifyDemoWalletChallenge(token: string, wallet: string, message: string, now = Date.now()): DemoChallenge | null {
  const normalized = normalizedWallet(wallet)
  const payload = decode<DemoChallenge>(token)
  if (!normalized || !payload) return null
  if (payload.type !== 'demo_wallet_challenge' || payload.aud !== DEMO_SESSION_AUDIENCE) return null
  if (payload.wallet !== normalized || payload.message !== message || payload.exp < Math.floor(now / 1000)) return null
  return payload
}

export function issueDemoSession(wallet: string, now = Date.now()): { token: string; session: DemoSession } {
  const normalized = normalizedWallet(wallet)
  if (!normalized) throw new Error('Invalid wallet')
  const session: DemoSession = {
    type: 'demo_session', aud: DEMO_SESSION_AUDIENCE, wallet: normalized,
    sessionId: crypto.randomUUID(), sponsoredCredits: 1, productionAuthorized: false,
    exp: Math.floor(now / 1000) + DEMO_SESSION_TTL_SECONDS,
  }
  return { token: sign(session), session }
}

export function verifyDemoSession(token: string | undefined, now = Date.now()): DemoSession | null {
  if (!token) return null
  const session = decode<DemoSession>(token)
  if (!session || session.type !== 'demo_session' || session.aud !== DEMO_SESSION_AUDIENCE) return null
  if (!normalizedWallet(session.wallet) || session.sponsoredCredits !== 1 || session.productionAuthorized !== false) return null
  return session.exp >= Math.floor(now / 1000) ? session : null
}

export function createSponsoredSandboxTask(session: DemoSession, scenario: DemoScenario, now = Date.now()): { task: SponsoredSandboxTask; taskToken: string } {
  const copy = scenarioCopy[scenario]
  if (!copy) throw new Error('Unsupported demo scenario')
  const task: SponsoredSandboxTask = {
    type: 'sponsored_sandbox_task', environment: 'sandbox', productionAuthorized: false,
    taskId: `demo_${crypto.randomUUID()}`, wallet: session.wallet, sessionId: session.sessionId,
    scenario, ...copy,
    payment: { mode: 'sponsored_demo_credit', charged: false, amount: '0.00', currency: 'USDC', transactionHash: null },
    createdAt: new Date(now).toISOString(), expiresAt: new Date(now + 15 * 60_000).toISOString(),
  }
  return { task, taskToken: sign({ ...task, exp: Math.floor((now + 15 * 60_000) / 1000) }) }
}

export function verifySponsoredSandboxTask(token: string, now = Date.now()): SponsoredSandboxTask | null {
  const payload = decode<SponsoredSandboxTask & { exp?: number }>(token)
  if (!payload || payload.type !== 'sponsored_sandbox_task' || payload.environment !== 'sandbox') return null
  if (payload.productionAuthorized !== false || payload.payment?.charged !== false || !payload.exp) return null
  if (payload.exp < Math.floor(now / 1000)) return null
  const { exp: _exp, ...task } = payload
  return task
}
