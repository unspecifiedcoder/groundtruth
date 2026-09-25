import { beforeAll, describe, expect, it } from 'vitest'
import { issueAdminSession, issueClaimToken, issueWalletChallenge, issueWalletSession, verifyAdminSession, verifyClaimToken, verifyWalletChallengeToken, verifyWalletSession } from '@/lib/security'
import { campaignTokenMatches } from '@/lib/campaign-auth'
import { createHash } from 'crypto'

beforeAll(() => { process.env.CLAIM_TOKEN_SECRET = 'test-only-secret-with-more-than-32-bytes' })

describe('signed capabilities', () => {
  it('binds claim tokens to both task and wallet', () => {
    const wallet = '0x1111111111111111111111111111111111111111'
    const token = issueClaimToken('task-1', wallet)
    expect(verifyClaimToken(token, 'task-1', wallet)).toBe(true)
    expect(verifyClaimToken(token, 'task-2', wallet)).toBe(false)
    expect(verifyClaimToken(token, 'task-1', '0x2222222222222222222222222222222222222222')).toBe(false)
    expect(verifyClaimToken(`${token}tampered`, 'task-1', wallet)).toBe(false)
  })

  it('binds wallet challenges to the exact message and wallet', () => {
    const wallet = '0x1111111111111111111111111111111111111111'
    const challenge = issueWalletChallenge(wallet)
    expect(verifyWalletChallengeToken(challenge.token, wallet, challenge.message)).toBe(true)
    expect(verifyWalletChallengeToken(challenge.token, wallet, `${challenge.message}!`)).toBe(false)
  })

  it('validates worker and operator sessions', () => {
    const wallet = '0x1111111111111111111111111111111111111111'
    expect(verifyWalletSession(issueWalletSession(wallet), wallet)).toBe(true)
    expect(verifyAdminSession(issueAdminSession())).toBe(true)
  })
})

describe('campaign capabilities', () => {
  it('compares a token against its stored hash', () => {
    const token = 'private-campaign-token'
    const hash = createHash('sha256').update(token).digest('hex')
    expect(campaignTokenMatches(hash, token)).toBe(true)
    expect(campaignTokenMatches(hash, 'wrong-token')).toBe(false)
  })
})
