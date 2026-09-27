export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
  const body = `# GroundTruth

> Independent, location-bound retail execution checks for brands, commerce teams, and software agents.

GroundTruth dispatches field operators to inspect shelves, prices, promotions, and displays. It returns accepted photographic evidence, structured observations, verification checks, and CSV/API-ready results.

## Commercial pilot

- 25 accepted checks in one agreed city zone
- One repeatable question: stock, shelf price, promotion/display, or store status
- $199 after coverage and acceptance criteria are confirmed
- [Check pilot coverage](${base}/pilot)
- [Inspect the illustrative output contract](${base}/campaigns/demo) — not customer work or traction

## Agent interfaces

- [A2A agent card](${base}/.well-known/agent-card.json)
- [A2A JSON-RPC endpoint](${base}/api/a2a)
- [Machine-readable service catalog](${base}/catalog.jsonl)
- [MCP Streamable HTTP endpoint](${base}/api/mcp)
- [OpenAPI document](${base}/api/openapi)
- [Developer guide](${base}/developers)

## Evaluate GroundTruth

- [Illustrative campaign output](${base}/campaigns/demo)
- [Technical and investor diligence](${base}/diligence)
- [Trust and evidence model](${base}/trust)
- [Service health](${base}/api/health)

## Current operating boundary

GroundTruth is in focused-pilot mode, initially building operator density in compact Hyderabad zones. Coverage, payout funding, pricing, and acceptance criteria are confirmed before real missions are published. Model scores measure evidence-to-brief consistency; they are not guarantees of factual truth. The $0.01 and $0.10 x402 tiers test integration plumbing and do not represent field-work pricing.
`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
