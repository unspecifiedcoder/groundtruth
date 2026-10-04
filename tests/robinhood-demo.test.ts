import { describe, expect, it } from 'vitest'
import {
  ROBINHOOD_DEMO_TASK_KEY,
  ROBINHOOD_RECEIPT_REGISTRY,
  ROBINHOOD_TESTNET_CHAIN_ID,
  ROBINHOOD_USDG,
  ROBINHOOD_USDG_ESCROW,
} from '../lib/robinhood-demo'

describe('Robinhood USDG demo constants', () => {
  it('pins the official testnet and deployed contracts', () => {
    expect(ROBINHOOD_TESTNET_CHAIN_ID).toBe(46630)
    expect(ROBINHOOD_USDG).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(ROBINHOOD_RECEIPT_REGISTRY).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(ROBINHOOD_USDG_ESCROW).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(ROBINHOOD_DEMO_TASK_KEY).toMatch(/^0x[0-9a-fA-F]{64}$/)
  })

  it('does not confuse the registry and escrow addresses', () => {
    expect(ROBINHOOD_RECEIPT_REGISTRY.toLowerCase()).not.toBe(ROBINHOOD_USDG_ESCROW.toLowerCase())
    expect(ROBINHOOD_USDG.toLowerCase()).not.toBe(ROBINHOOD_USDG_ESCROW.toLowerCase())
  })
})
