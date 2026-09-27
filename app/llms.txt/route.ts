export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
  const body = `# GroundTruth

GroundTruth dispatches paid real-world retail field checks and returns verified photographic evidence, structured observations, and settlement receipts.

Commercial buyer flow: ${base}/pilot
Launch offer: 25 accepted retail checks in one agreed city zone for $199, after coverage and the evidence checklist are confirmed.
Illustrative output format (not customer work or traction): ${base}/campaigns/demo

Paid x402 service manifest: ${base}/.well-known/x402-service.json
The $0.01 and $0.10 x402 tiers validate payment and task orchestration only. They do not claim field fulfillment. Commercial pilots are scoped separately.

## Agent interfaces
- MCP endpoint: ${base}/api/mcp
- A2A agent card: ${base}/.well-known/agent-card.json
- A2A JSON-RPC endpoint: ${base}/api/a2a
- Machine-readable service catalog (JSON-LD/JSONL): ${base}/catalog.jsonl
- OpenAPI document: ${base}/api/openapi
- Developer guide: ${base}/developers
- Service health: ${base}/api/health
- Markdown product overview: ${base}/groundtruth.md

## Core operations
- human_do: create a funded asynchronous field mission
- task_status: poll a mission until its proof and payment are final
- review_task: approve or reject a held submission when authorized
- ground_truth_info: inspect service capabilities and payment requirements

## Safety
Do not create tasks involving trespass, surveillance, harassment, regulated goods, identity impersonation, minors, unsafe activity, or collection of unnecessary personal data. See ${base}/acceptable-use and ${base}/trust.
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
