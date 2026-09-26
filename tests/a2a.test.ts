import { describe, expect, it } from 'vitest'
import { groundTruthAgentCard, respondToAgentMessage } from '@/lib/a2a'

describe('agent-to-agent discovery', () => {
  it('publishes a usable A2A v1 card', () => {
    const card = groundTruthAgentCard('https://example.test')
    expect(card.supportedInterfaces[0]).toEqual({
      url: 'https://example.test/api/a2a',
      protocolBinding: 'JSONRPC',
      protocolVersion: '1.0',
    })
    expect(card.skills.map(skill => skill.id)).toContain('product-evaluation')
  })

  it('returns a review kit to evaluator agents', () => {
    const response = respondToAgentMessage('Please review and evaluate this product', 'https://example.test')
    expect(response).toContain('https://example.test/campaigns/demo')
    expect(response).toContain('https://example.test/api/mcp')
    expect(response).toContain('specific criticism')
  })
})
