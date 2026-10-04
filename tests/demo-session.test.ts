import { beforeEach, describe, expect, it } from 'vitest'
import {
  createSponsoredSandboxTask,
  issueDemoSession,
  issueDemoWalletChallenge,
  verifyDemoSession,
  verifyDemoWalletChallenge,
  verifySponsoredSandboxTask,
} from '@/lib/demo-session'

const wallet = '0x1111111111111111111111111111111111111111'

describe('sponsored demo security boundary', () => {
  beforeEach(() => { process.env.DEMO_SESSION_SECRET = 'test-only-demo-secret-that-is-long-enough' })

  it('binds a short-lived ownership challenge to wallet and exact message', () => {
    const now = Date.UTC(2026, 9, 4)
    const challenge = issueDemoWalletChallenge(wallet, now)
    expect(verifyDemoWalletChallenge(challenge.challengeToken, wallet, challenge.message, now)?.wallet).toBe(wallet)
    expect(verifyDemoWalletChallenge(challenge.challengeToken, wallet, `${challenge.message}!`, now)).toBeNull()
    expect(verifyDemoWalletChallenge(challenge.challengeToken, '0x2222222222222222222222222222222222222222', challenge.message, now)).toBeNull()
    expect(verifyDemoWalletChallenge(challenge.challengeToken, wallet, challenge.message, now + 301_000)).toBeNull()
  })

  it('issues an explicitly sandbox-only session that expires', () => {
    const now = Date.UTC(2026, 9, 4)
    const issued = issueDemoSession(wallet, now)
    const session = verifyDemoSession(issued.token, now)
    expect(session).toMatchObject({ wallet, sponsoredCredits: 1, productionAuthorized: false, aud: 'groundtruth:sponsored-sandbox' })
    expect(verifyDemoSession(issued.token, now + 16 * 60_000)).toBeNull()
    expect(verifyDemoSession(`${issued.token}tampered`, now)).toBeNull()
  })

  it('creates a sponsored task with no payment or production authority', () => {
    const now = Date.UTC(2026, 9, 4)
    const session = issueDemoSession(wallet, now).session
    const { task, taskToken } = createSponsoredSandboxTask(session, 'retail_shelf_check', now)
    expect(task.environment).toBe('sandbox')
    expect(task.productionAuthorized).toBe(false)
    expect(task.payment).toEqual({ mode: 'sponsored_demo_credit', charged: false, amount: '0.00', currency: 'USDC', transactionHash: null })
    expect(task.evidence.relaxedDemoChecks).toBe(true)
    expect(verifySponsoredSandboxTask(taskToken, now)).toEqual(task)
    expect(verifySponsoredSandboxTask(taskToken, now + 16 * 60_000)).toBeNull()
  })
})
