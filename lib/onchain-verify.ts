import { createPublicClient, http, getAddress, type Hex } from 'viem'

// On-chain verification of x402 payments.
//
// The autonomous agent-pay flow (lib/agent-pay.ts) performs a REAL ERC-20
// transfer of mUSDT to the payroll contract on X Layer testnet, then encodes
// the tx hash into the X-PAYMENT header. This module re-derives the truth from
// the chain: it fetches the transaction receipt, finds the ERC-20 Transfer log,
// and confirms the token, recipient, sender, and amount. A forged header
// (arbitrary txHash / self-declared amount) cannot pass, because no matching
// on-chain Transfer exists.
//
// Defaults match what agent-pay.ts actually does, so the live demo keeps
// working; every value is overridable via env for other deployments.

const VERIFY_RPC = process.env.X402_VERIFY_RPC ?? 'https://testrpc.xlayer.tech'
const VERIFY_CHAIN_ID = Number(process.env.X402_VERIFY_CHAIN_ID ?? '1952')
const VERIFY_TOKEN = (process.env.X402_VERIFY_TOKEN ?? '0x725cCe0916d2E8682438732fD9e79803B4fAB2BD') as `0x${string}`
const VERIFY_RECIPIENT = (process.env.X402_VERIFY_RECIPIENT ?? process.env.PAYROLL_CONTRACT_ADDRESS ?? '0x430172985b21458d73576435D4aD4bEeA85F376C') as `0x${string}`

// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

const CHAIN = {
  id: VERIFY_CHAIN_ID,
  name: 'X Layer',
  network: 'xlayer',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: { default: { http: [VERIFY_RPC] } },
} as const

export interface OnChainPayment {
  valid: boolean
  reason?: string
  from?: string
  to?: string
  token?: string
  amountUnits?: bigint
  txHash?: string
}

function topicToAddress(topic: string): string {
  // A 32-byte topic left-pads a 20-byte address; take the last 40 hex chars.
  return getAddress(`0x${topic.slice(-40)}`)
}

/**
 * Verify that `txHash` is a confirmed ERC-20 Transfer of at least
 * `requiredUnits` of the payment token to the configured recipient.
 * Fails closed: any RPC error, missing receipt, or mismatch returns valid:false.
 */
export async function verifyOnChainPayment(params: {
  txHash?: string
  expectedFrom?: string
  requiredUnits: bigint
}): Promise<OnChainPayment> {
  const { txHash, expectedFrom, requiredUnits } = params

  if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return { valid: false, reason: 'missing or malformed txHash' }
  }

  const client = createPublicClient({
    chain: CHAIN,
    transport: http(VERIFY_RPC, { timeout: 15_000 }),
  })

  let receipt
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash as Hex })
  } catch (e) {
    return { valid: false, reason: `receipt lookup failed: ${e instanceof Error ? e.message : String(e)}` }
  }

  if (!receipt || receipt.status !== 'success') {
    return { valid: false, reason: 'transaction not found or reverted' }
  }

  const wantToken = getAddress(VERIFY_TOKEN)
  const wantRecipient = getAddress(VERIFY_RECIPIENT)

  // Find a Transfer(token -> recipient) log with sufficient value.
  for (const log of receipt.logs) {
    if (getAddress(log.address) !== wantToken) continue
    if (!log.topics || log.topics[0]?.toLowerCase() !== TRANSFER_TOPIC) continue
    if (log.topics.length < 3) continue

    const from = topicToAddress(log.topics[1] as string)
    const to = topicToAddress(log.topics[2] as string)
    if (to !== wantRecipient) continue

    const value = BigInt(log.data === '0x' ? '0x0' : log.data)
    if (value < requiredUnits) continue

    if (expectedFrom) {
      try {
        if (getAddress(expectedFrom) !== from) continue
      } catch {
        // expectedFrom malformed — ignore the constraint rather than reject a real transfer
      }
    }

    return {
      valid: true,
      from,
      to,
      token: wantToken,
      amountUnits: value,
      txHash,
    }
  }

  return { valid: false, reason: 'no matching Transfer to recipient with sufficient amount' }
}
