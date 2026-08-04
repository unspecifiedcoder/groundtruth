import { x402Client, x402HTTPClient } from '@okxweb3/x402-core/client'
import { registerExactEvmScheme } from '@okxweb3/x402-evm/exact/client'
import { privateKeyToAccount } from 'viem/accounts'

// Buyer half of the official OKX Payment SDK.
//
// Used by our own MCP `human_do` tool so an agent calling us over MCP pays for
// real through the same protocol an external OKX buyer would use. Previously
// this signed a Permit2 authorization by hand, which the SDK-backed endpoint
// (correctly) rejects — the tool then fell through to the demo bypass and no
// payment ever happened.
//
// Flow: unpaid probe → decode the PAYMENT-REQUIRED challenge → sign EIP-3009 →
// replay with the PAYMENT-SIGNATURE header.

export interface PaidRequestResult {
  response: Response
  paid: boolean
  payer?: string
  settlement?: Record<string, unknown>
  error?: string
}

function decodeChallenge(res: Response): unknown | null {
  const header = res.headers.get('payment-required') ?? res.headers.get('PAYMENT-REQUIRED')
  if (!header) return null
  try {
    return JSON.parse(Buffer.from(header, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

export function decodeSettlement(res: Response): Record<string, unknown> | undefined {
  const header = res.headers.get('payment-response') ?? res.headers.get('PAYMENT-RESPONSE')
  if (!header) return undefined
  try {
    return JSON.parse(Buffer.from(header, 'base64').toString('utf8'))
  } catch {
    return undefined
  }
}

/**
 * POSTs a JSON body to an x402-protected URL, paying with the OKX SDK if the
 * resource answers 402. Returns the final response plus settlement details.
 */
export async function postWithPayment(
  url: string,
  body: unknown,
  privateKey: `0x${string}`,
  timeoutMs = 60_000
): Promise<PaidRequestResult> {
  const json = JSON.stringify(body)
  const baseHeaders = { 'Content-Type': 'application/json' }

  const probe = await fetch(url, {
    method: 'POST',
    headers: baseHeaders,
    body: json,
    signal: AbortSignal.timeout(timeoutMs),
  })

  // Already free / already satisfied — nothing to pay.
  if (probe.status !== 402) return { response: probe, paid: false }

  const challenge = decodeChallenge(probe)
  if (!challenge) {
    return { response: probe, paid: false, error: 'no PAYMENT-REQUIRED challenge on the 402' }
  }

  const account = privateKeyToAccount(privateKey)
  const client = new x402Client()
  registerExactEvmScheme(client, { signer: account })

  let payHeaders: Record<string, string>
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = await client.createPaymentPayload(challenge as any)
    payHeaders = new x402HTTPClient(client).encodePaymentSignatureHeader(payload)
  } catch (e) {
    return {
      response: probe,
      paid: false,
      error: `payment signing failed: ${e instanceof Error ? e.message : String(e)}`,
    }
  }

  const paidRes = await fetch(url, {
    method: 'POST',
    headers: { ...baseHeaders, ...payHeaders },
    body: json,
    signal: AbortSignal.timeout(timeoutMs),
  })

  return {
    response: paidRes,
    paid: paidRes.ok,
    payer: account.address,
    settlement: decodeSettlement(paidRes),
  }
}
