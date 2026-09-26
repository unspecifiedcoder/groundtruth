export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
  return Response.json({
    name: 'GroundTruth',
    description: 'Verified real-world retail field evidence for software and AI agents.',
    homepage: base,
    documentation: `${base}/developers`,
    openapi: `${base}/api/openapi`,
    interfaces: [
      { type: 'mcp', transport: 'streamable-http', url: `${base}/api/mcp` },
      { type: 'a2a', transport: 'json-rpc', version: '1.0', url: `${base}/api/a2a`, agent_card: `${base}/.well-known/agent-card.json` },
    ],
    capabilities: ['retail shelf availability', 'price intelligence', 'display compliance', 'photo evidence', 'structured observations'],
    payment: { protocol: 'x402', currency: 'USDT', details: 'Discover current terms through ground_truth_info.' },
  }, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
