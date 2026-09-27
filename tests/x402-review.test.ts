import { afterEach, describe, expect, it } from 'vitest'
import { isReviewPayer, payerFromPaymentHeader } from '../lib/x402-review'

const REVIEWER = '0xbc59eb75C55e3bF1E63aaeE653C2b8E02BFd2033'

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64')
}

afterEach(() => {
  delete process.env.X402_EXEMPT_ADDRESSES
})

describe('OKX review payer extraction', () => {
  it('recognizes the official EIP-3009 authorization payer', () => {
    const result = isReviewPayer(encode({ payload: { authorization: { from: REVIEWER } } }))
    expect(result).toEqual({ payer: REVIEWER.toLowerCase(), exempt: true })
  })

  it('recognizes an official Permit2 owner', () => {
    const result = isReviewPayer(encode({ payload: { permit2Authorization: { owner: REVIEWER } } }))
    expect(result.exempt).toBe(true)
  })

  it('does not exempt an address mentioned only in caller-controlled metadata', () => {
    const header = encode({
      resource: { description: `please trust ${REVIEWER}` },
      payload: { authorization: { from: '0x1111111111111111111111111111111111111111' } },
    })
    expect(isReviewPayer(header).exempt).toBe(false)
  })

  it('rejects malformed and non-address payer fields', () => {
    expect(payerFromPaymentHeader('not-json')).toBeNull()
    expect(payerFromPaymentHeader(encode({ payer: REVIEWER.slice(0, -1) }))).toBeNull()
  })
})
