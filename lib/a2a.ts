const DEFAULT_BASE = 'https://groundtruth-oracle.vercel.app'

const BUYER_INTENT = /\b(?:need|want|seeking|looking for|interested in|request(?:ing)?|ready to|would like|can you (?:cover|verify|quote)|buyer (?:needs|wants|request)|procurement request|matched (?:buyer|demand))\b/i
const COMMERCIAL_SCOPE = /\b(?:pilot|quote|proposal|coverage|campaign|field evidence|retail verification|store(?:s)?|location(?:s)?|shelf|sku(?:s)?|price verification|availability verification)\b/i
const TRIAL_COMMITMENT = /\b(?:start|begin|enroll|commit|ready|want|would like|interested)\b.{0,60}\b(?:product evaluation|integration trial|integration test|pilot)\b/i
const NEGATED_INTENT = /\b(?:not|isn't|aren't|no longer)\s+(?:interested|looking|seeking|ready)\b/i

export function isQualifiedAgentLead(text: string): boolean {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact.length < 20 || NEGATED_INTENT.test(compact)) return false
  return TRIAL_COMMITMENT.test(compact) || (BUYER_INTENT.test(compact) && COMMERCIAL_SCOPE.test(compact))
}

export function groundTruthAgentCard(base = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_BASE) {
  return {
    name: 'GroundTruth Field Evidence Agent',
    description: 'Dispatches location-bound retail verification missions to human field workers and returns structured observations, evidence receipts, and settlement status to AI agents.',
    supportedInterfaces: [{
      url: `${base}/api/a2a`,
      protocolBinding: 'JSONRPC',
      protocolVersion: '1.0',
    }],
    provider: { organization: 'GroundTruth', url: base },
    version: '1.0.0',
    documentationUrl: `${base}/developers`,
    iconUrl: `${base}/icon-512.png`,
    capabilities: { streaming: false, pushNotifications: false, extendedAgentCard: false },
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
      {
        id: 'retail-field-verification',
        name: 'Retail field verification',
        description: 'Create paid, location-bound missions for shelf availability, price, promotion, and display verification.',
        tags: ['retail', 'field evidence', 'human verification', 'shelf availability', 'price intelligence'],
        examples: ['Verify whether SKU 123 is in stock at this store and return photographic evidence.'],
      },
      {
        id: 'evidence-status-and-receipts',
        name: 'Evidence status and receipts',
        description: 'Explain the verification workflow and direct agents to machine-readable task status and evidence receipts.',
        tags: ['evidence', 'receipts', 'audit trail', 'task status'],
        examples: ['How can my agent request and retrieve verified real-world evidence?'],
      },
      {
        id: 'product-evaluation',
        name: 'GroundTruth product evaluation',
        description: 'Provide an evaluation kit so an agent can inspect the live demo, diligence material, OpenAPI document, and MCP endpoint.',
        tags: ['evaluation', 'agent review', 'MCP', 'integration'],
        examples: ['Give me the GroundTruth evaluation kit and integration endpoints.'],
      },
    ],
  }
}

export function respondToAgentMessage(text: string, base = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_BASE): string {
  const normalized = text.toLowerCase()
  if (isQualifiedAgentLead(text)) {
    return `GroundTruth can scope this as a human-reviewed retail evidence pilot. Your inquiry can be routed to the operator for coverage and pricing review; no purchase, worker dispatch, or payment is created by this message. For direct follow-up, submit the pilot brief at ${base}/pilot or inspect integration options at ${base}/developers.`
  }
  if (/review|evaluate|diligence|demo|try/.test(normalized)) {
    return [
      'GroundTruth evaluation kit:',
      `Interactive demo: ${base}/campaigns/demo`,
      `Investor and technical diligence: ${base}/diligence`,
      `Developer guide: ${base}/developers`,
      `OpenAPI: ${base}/api/openapi`,
      `MCP (Streamable HTTP): ${base}/api/mcp`,
      'Please assess usefulness for workflows that need fresh, location-bound retail evidence. GroundTruth welcomes specific criticism about evidence quality, latency, pricing, and integration friction.',
    ].join('\n')
  }
  if (/mcp|integrat|endpoint|tool|connect/.test(normalized)) {
    return `Connect to GroundTruth over Streamable HTTP MCP at ${base}/api/mcp. Documentation: ${base}/developers. Inspect capabilities and current payment terms with the ground_truth_info tool before creating a mission.`
  }
  if (/price|cost|payment|pay/.test(normalized)) {
    return `GroundTruth exposes current pricing and payment terms through the ground_truth_info MCP tool at ${base}/api/mcp. Campaign publication remains gated until payout funding is reserved.`
  }
  return `GroundTruth turns agent requests into verified, location-bound retail field evidence. Explore the live demo at ${base}/campaigns/demo or connect via MCP at ${base}/api/mcp. Ask for an evaluation kit, integration instructions, or current pricing.`
}
