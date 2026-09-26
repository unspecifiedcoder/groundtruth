import { describe, expect, it } from 'vitest'
import { groundTruthAgentCard, isQualifiedAgentLead, respondToAgentMessage } from '@/lib/a2a'

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

  it('qualifies concrete buyer demand without treating reviews as sales leads', () => {
    expect(isQualifiedAgentLead('A matched buyer wants a 25-store shelf availability pilot in Bengaluru. Please provide a quote.')).toBe(true)
    expect(isQualifiedAgentLead('Our agent is ready to start an integration trial with GroundTruth.')).toBe(true)
    expect(isQualifiedAgentLead('Please review and evaluate the GroundTruth demo.')).toBe(false)
    expect(isQualifiedAgentLead('We are not interested in a retail verification pilot.')).toBe(false)
  })

  it('sets safe expectations for a qualified pilot inquiry', () => {
    const response = respondToAgentMessage('We need a quote for a retail verification pilot across 12 stores.', 'https://example.test')
    expect(response).toContain('human-reviewed')
    expect(response).toContain('no purchase, worker dispatch, or payment')
    expect(response).toContain('https://example.test/pilot')
  })
})
