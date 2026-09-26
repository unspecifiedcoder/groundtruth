import { OKXFacilitatorClient } from '@okxweb3/x402-core'
import { HTTPFacilitatorClient, x402ResourceServer, x402HTTPResourceServer } from '@okxweb3/x402-core/server'
import type { HTTPRequestContext } from '@okxweb3/x402-core/server'
import { ExactEvmScheme } from '@okxweb3/x402-evm/exact/server'
import type { NextRequest } from 'next/server'
import { resolveTaskPricing, TASK_PRICE_TIERS, toUnits } from './money'

// ── Official OKX Payment SDK integration ────────────────────────────────────
//
// Replaces the previous self-hosted x402 implementation (custom Permit2 sign /
// verify / settle). OKX's marketplace verifies that a seller actually delegates
// verification + settlement to the OKX Broker/Facilitator, which is what this
// module does: we build the 402 challenge, verify the buyer's credential, and
// settle — all through OKXFacilitatorClient, never ourselves.
//
// Two production rails are advertised for the same product:
// - Base mainnet USDC through a public x402 v2 facilitator, for broad agent-wallet compatibility.
// - X Layer USD₮0 through the authenticated OKX facilitator.
// Both use exact EIP-3009 authorization and settle directly to PAY_TO.

export const X_LAYER_NETWORK = (process.env.X402_NETWORK ?? 'eip155:196') as `eip155:${string}`
export const BASE_NETWORK = 'eip155:8453' as const
export const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
export const BASE_FACILITATOR_URL = process.env.BASE_X402_FACILITATOR_URL ?? 'https://facilitator.openx402.ai'
const PAY_TO = (process.env.X402_VERIFY_RECIPIENT ??
  '0x72db032c0dFB6E7502e16A73fabdab31712dc706') as string
const ROUTE_PATTERN = 'POST /api/v1/human-do'
// GET is registered too so discovery probes (including OKX's own reachability
// check) get a real SDK-built PAYMENT-REQUIRED challenge rather than a bare 402.
const GET_ROUTE_PATTERN = 'GET /api/v1/human-do'
export const RESOURCE_PATH = '/api/v1/human-do'

// x402 Bazaar metadata makes the paid endpoint discoverable as a product, not
// merely reachable as a URL. It also gives a buyer enough request/response
// shape to build the first paid call without learning by being rejected.
export const BAZAAR_EXTENSION = {
  bazaar: {
    info: {
      input: {
        type: 'http',
        method: 'POST',
        bodyType: 'json',
        body: {
          intent: 'GroundTruth external integration test',
          service_tier: 'integration_test',
          proof_spec: {
            type: 'form',
            instructions: 'Return a short integration receipt',
            formFields: ['result'],
          },
        },
      },
      output: {
        type: 'json',
        example: {
          task_id: '00000000-0000-0000-0000-000000000000',
          status: 'pending',
          service_tier: 'integration_test',
          budget_usdt: '0.01',
          poll_url: 'https://groundtruth-oracle.vercel.app/api/v1/tasks/00000000-0000-0000-0000-000000000000',
          async: true,
        },
      },
    },
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['input', 'output'],
      properties: {
        input: {
          type: 'object',
          required: ['type', 'method', 'bodyType', 'body'],
          properties: {
            type: { const: 'http' },
            method: { const: 'POST' },
            bodyType: { const: 'json' },
            body: {
              type: 'object',
              required: ['intent', 'service_tier'],
              properties: {
                intent: { type: 'string', minLength: 1, maxLength: 500 },
                service_tier: { enum: Object.keys(TASK_PRICE_TIERS) },
                proof_spec: { type: 'object' },
                target_location: { type: 'object' },
                timeout_seconds: { type: 'number', minimum: 60, maximum: 86400 },
              },
            },
          },
        },
        output: {
          type: 'object',
          required: ['type', 'example'],
          properties: {
            type: { const: 'json' },
            example: { type: 'object' },
          },
        },
      },
    },
  },
} as const

let cached: Promise<x402HTTPResourceServer> | null = null

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set — required for the OKX Payment SDK`)
  return v
}

export function getHttpResourceServer(): Promise<x402HTTPResourceServer> {
  if (cached) return cached
  cached = (async () => {
    const facilitator = new OKXFacilitatorClient({
      apiKey: requireEnv('OKX_API_KEY'),
      secretKey: requireEnv('OKX_SECRET_KEY'),
      passphrase: requireEnv('OKX_PASSPHRASE'),
      ...(process.env.OKX_BASE_URL ? { baseUrl: process.env.OKX_BASE_URL } : {}),
    } as ConstructorParameters<typeof OKXFacilitatorClient>[0])

    const baseFacilitator = new HTTPFacilitatorClient({ url: BASE_FACILITATOR_URL })

    // Earlier clients win only when two facilitators advertise the same rail.
    // OKX remains authoritative for X Layer; OpenX402 handles Base mainnet.
    const resourceServer = new x402ResourceServer([facilitator, baseFacilitator])
    resourceServer.register('eip155:*', new ExactEvmScheme())

    const price = (context: HTTPRequestContext) => `$${resolveTaskPricing(context.adapter.getBody?.()).priceUsdt}`
    const basePrice = (context: HTTPRequestContext) => ({
      asset: BASE_USDC,
      amount: toUnits(resolveTaskPricing(context.adapter.getBody?.()).priceUsdt).toString(),
      extra: {
        name: 'USD Coin',
        version: '2',
        assetTransferMethod: 'eip3009',
      },
    })

    // Load both facilitators before building the advertised options. A temporary
    // outage on one rail must not take the other rail down with it.
    await resourceServer.initialize()
    const accepts = [
      {
        scheme: 'exact' as const,
        network: BASE_NETWORK,
        payTo: PAY_TO,
        price: basePrice,
        maxTimeoutSeconds: 300,
      },
      {
        scheme: 'exact' as const,
        network: X_LAYER_NETWORK,
        payTo: PAY_TO,
        price,
        maxTimeoutSeconds: 300,
      },
    ].filter(option => resourceServer.getSupportedKind(2, option.network, option.scheme))

    if (accepts.length === 0) throw new Error('No configured x402 payment rail is currently available')

    const routeConfig = {
      // The server—not the caller—maps a named product tier to its exact price.
      // A missing tier remains the low-cost integration probe; real field tiers
      // pay useful rewards.
      accepts,
      // The challenge advertises the POST body schema so a client replaying the
      // authorized request knows what to send. Every field is optional in
      // practice — a paid call with no body still creates a task.
      description:
        'GroundTruth task creation — Reality-as-a-Service. ' +
        'POST JSON body: {"intent": string (1-500 chars, what a human oracle must verify), ' +
        '"proof_spec"?: {"type": "photo"|"form", "instructions": string, "minPhotos"?: 1-5, "formFields"?: string[]}, ' +
        `"service_tier"?: ${Object.keys(TASK_PRICE_TIERS).join('|')}, "timeout_seconds"?: 60-86400}. ` +
        'The integration_test tier is a public $0.01 USDC or USDT0 MVP test mission. ' +
        'Body is optional: omitted fields create a paid test task and return a task_id to poll.',
      mimeType: 'application/json',
      resource: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}${RESOURCE_PATH}`,
      extensions: BAZAAR_EXTENSION,
      // Echo the challenge in the body as well. OKX validates the
      // PAYMENT-REQUIRED header, but clients (and humans) reading the body get
      // the same information instead of an empty object.
      unpaidResponseBody: () => ({
        contentType: 'application/json',
        body: { error: 'Payment required', x402Version: 2 },
      }),
    }

    const httpServer = new x402HTTPResourceServer(resourceServer, {
      [ROUTE_PATTERN]: routeConfig,
      [GET_ROUTE_PATTERN]: routeConfig,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // resourceServer was initialized above so the route contains only healthy,
    // facilitator-backed rails.
    return httpServer
  })()
  // A failed init must not be cached forever — let the next request retry.
  cached.catch(() => { cached = null })
  return cached
}

/**
 * Adapts a Next.js request (plus its already-parsed body) to the SDK's
 * framework-agnostic HTTPAdapter interface.
 */
export function makeAdapter(req: NextRequest, body: unknown) {
  const url = new URL(req.url)
  return {
    getHeader: (name: string) => req.headers.get(name) ?? undefined,
    getMethod: () => req.method,
    getPath: () => url.pathname,
    getUrl: () => req.url,
    getAcceptHeader: () => req.headers.get('accept') ?? '',
    getUserAgent: () => req.headers.get('user-agent') ?? '',
    getQueryParams: () => Object.fromEntries(url.searchParams.entries()),
    getQueryParam: (name: string) => url.searchParams.get(name) ?? undefined,
    getBody: () => body,
  }
}

export function makeContext(req: NextRequest, body: unknown) {
  return {
    adapter: makeAdapter(req, body),
    path: new URL(req.url).pathname,
    method: req.method,
    paymentHeader:
      req.headers.get('X-PAYMENT') ??
      req.headers.get('x-payment') ??
      req.headers.get('PAYMENT-SIGNATURE') ??
      req.headers.get('payment-signature') ??
      undefined,
    routePattern: req.method === 'GET' ? GET_ROUTE_PATTERN : ROUTE_PATTERN,
  }
}
