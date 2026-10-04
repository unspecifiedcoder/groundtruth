import { beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { POST as challengePost } from '@/app/api/demo/wallet/challenge/route'
import { POST as verifyPost } from '@/app/api/demo/wallet/verify/route'
import { POST as taskPost } from '@/app/api/demo/tasks/route'

const account = privateKeyToAccount(generatePrivateKey())

function request(path: string, body: unknown, cookie?: string) {
  return new NextRequest(`https://groundtruth.example${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      host: 'groundtruth.example',
      origin: 'https://groundtruth.example',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe('sponsored demo API flow', () => {
  beforeEach(() => {
    process.env.DEMO_SESSION_SECRET = 'test-only-demo-secret-that-is-long-enough'
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('authenticates wallet ownership and creates one isolated no-charge task', async () => {
    const challengeResponse = await challengePost(request('/api/demo/wallet/challenge', { wallet: account.address }))
    expect(challengeResponse.status).toBe(200)
    const challenge = await challengeResponse.json() as { message: string; challengeToken: string }
    const signature = await account.signMessage({ message: challenge.message })

    const verifyResponse = await verifyPost(request('/api/demo/wallet/verify', {
      wallet: account.address,
      message: challenge.message,
      challengeToken: challenge.challengeToken,
      signature,
    }))
    expect(verifyResponse.status).toBe(200)
    const cookie = verifyResponse.headers.get('set-cookie')?.split(';')[0]
    expect(cookie).toMatch(/^gt_demo_session=/)

    const taskResponse = await taskPost(request('/api/demo/tasks', { scenario: 'retail_shelf_check' }, cookie))
    expect(taskResponse.status).toBe(201)
    const result = await taskResponse.json()
    expect(result.task).toMatchObject({
      environment: 'sandbox',
      productionAuthorized: false,
      payment: { charged: false, amount: '0.00', transactionHash: null },
    })
    expect(result.disclosure).toContain('No USDC was charged')

    const replay = await taskPost(request('/api/demo/tasks', { scenario: 'retail_shelf_check' }, cookie))
    expect(replay.status).toBe(409)
  })
})
