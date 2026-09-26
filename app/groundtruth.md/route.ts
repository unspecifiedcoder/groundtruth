export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
  const body = `# GroundTruth

> Verified, location-bound retail field evidence for software and autonomous agents.

GroundTruth dispatches human field workers to inspect shelves, prices, promotions, and displays. It returns structured observations, screened photographic evidence, verification checks, and settlement status.

## Agent interfaces

- [A2A agent card](${base}/.well-known/agent-card.json)
- [A2A JSON-RPC endpoint](${base}/api/a2a)
- [MCP Streamable HTTP endpoint](${base}/api/mcp)
- [OpenAPI document](${base}/api/openapi)
- [Developer guide](${base}/developers)

## Evaluate GroundTruth

- [Interactive campaign demo](${base}/campaigns/demo)
- [Technical and investor diligence](${base}/diligence)
- [Trust and evidence model](${base}/trust)
- [Service health](${base}/api/health)

## Current operating boundary

GroundTruth is in focused-pilot mode. Coverage, payout funding, pricing, and acceptance criteria are confirmed before real missions are published. Model scores measure evidence-to-brief consistency; they are not guarantees of factual truth.
`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
