import { OKXFacilitatorClient } from '@okxweb3/x402-core'
import { x402ResourceServer, x402HTTPResourceServer } from '@okxweb3/x402-core/server'
import { ExactEvmScheme } from '@okxweb3/x402-evm/exact/server'
import type { NextRequest } from 'next/server'

// ── Official OKX Payment SDK integration ────────────────────────────────────
//
// Replaces the previous self-hosted x402 implementation (custom Permit2 sign /
// verify / settle). OKX's marketplace verifies that a seller actually delegates
// verification + settlement to the OKX Broker/Facilitator, which is what this
// module does: we build the 402 challenge, verify the buyer's credential, and
// settle — all through OKXFacilitatorClient, never ourselves.
//
// Scheme: `exact` on X Layer. USD₮0 natively supports EIP-3009, so buyers sign
// transferWithAuthorization (the default, zero-approve path the OKX Agentic
// Wallet produces). The facilitator broadcasts the transfer to `payTo`.

const NETWORK = (process.env.X402_NETWORK ?? 'eip155:196') as `eip155:${string}`
const PAY_TO = (process.env.X402_VERIFY_RECIPIENT ??
  '0x72db032c0dFB6E7502e16A73fabdab31712dc706') as string
const ROUTE_PATTERN = 'POST /api/v1/human-do'
export const RESOURCE_PATH = '/api/v1/human-do'

// Fallback advertised price when we can't read a budget off the request body
// (e.g. the GET discovery probe). Buyers paying a larger budget are handled by
// the dynamic price below.
const DEFAULT_PRICE = process.env.X402_DEFAULT_PRICE ?? '$0.01'

function priceFromBody(body: unknown): string {
  const budget = (body as { budget_usdt?: unknown } | null)?.budget_usdt
  if (typeof budget === 'string' && /^\d+(\.\d+)?$/.test(budget) && Number(budget) > 0) {
    return `$${budget}`
  }
  return DEFAULT_PRICE
}

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

    const resourceServer = new x402ResourceServer(facilitator)
    resourceServer.register(NETWORK, new ExactEvmScheme())

    const httpServer = new x402HTTPResourceServer(resourceServer, {
      [ROUTE_PATTERN]: {
        accepts: [
          {
            scheme: 'exact',
            network: NETWORK,
            payTo: PAY_TO,
            // Charge exactly the budget the caller asked for.
            price: (ctx: { adapter: { getBody?: () => unknown } }) =>
              priceFromBody(ctx.adapter.getBody?.()),
            maxTimeoutSeconds: 300,
          },
        ],
        description: 'GroundTruth task creation — Reality-as-a-Service',
        mimeType: 'application/json',
        resource: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}${RESOURCE_PATH}`,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // Loads the facilitator's supported kinds; required before serving.
    await httpServer.initialize()
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
    routePattern: ROUTE_PATTERN,
  }
}
