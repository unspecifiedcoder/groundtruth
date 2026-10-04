import { beforeEach, describe, expect, it } from 'vitest'
import { consumeDemoChallenge, consumeSponsoredDemoCredit } from '@/lib/demo-rate-limit'

describe('sponsored demo credit limits', () => {
  beforeEach(() => {
    process.env.DEMO_SESSION_SECRET = 'test-only-demo-secret-that-is-long-enough'
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('consumes a wallet challenge only once', async () => {
    const challengeId = crypto.randomUUID()
    await expect(consumeDemoChallenge(challengeId)).resolves.toBe(true)
    await expect(consumeDemoChallenge(challengeId)).resolves.toBe(false)
  })

  it('grants only one sponsored credit to a wallet across sessions', async () => {
    const wallet = `0x${crypto.randomUUID().replaceAll('-', '').padEnd(40, '0').slice(0, 40)}`
    await expect(consumeSponsoredDemoCredit(wallet, crypto.randomUUID())).resolves.toEqual({ ok: true })
    await expect(consumeSponsoredDemoCredit(wallet, crypto.randomUUID())).resolves.toEqual({ ok: false, reason: 'already_used' })
  })

  it('grants only one sponsored credit per session', async () => {
    const session = crypto.randomUUID()
    const firstWallet = `0x${crypto.randomUUID().replaceAll('-', '').padEnd(40, '1').slice(0, 40)}`
    const secondWallet = `0x${crypto.randomUUID().replaceAll('-', '').padEnd(40, '2').slice(0, 40)}`
    await expect(consumeSponsoredDemoCredit(firstWallet, session)).resolves.toEqual({ ok: true })
    await expect(consumeSponsoredDemoCredit(secondWallet, session)).resolves.toEqual({ ok: false, reason: 'already_used' })
  })
})
