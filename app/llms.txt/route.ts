export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
  const body = `# GroundTruth

GroundTruth dispatches paid real-world retail field checks and returns verified photographic evidence, structured observations, and settlement receipts.

## Agent interfaces
- MCP endpoint: ${base}/api/mcp
- OpenAPI document: ${base}/api/openapi
- Developer guide: ${base}/developers
- Service health: ${base}/api/health

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
