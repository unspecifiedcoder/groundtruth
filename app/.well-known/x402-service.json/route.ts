import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
  return NextResponse.json({
    x402: '2.0',
    name: 'groundtruth-field-evidence',
    description: 'Dispatch location-bound human checks and receive structured observations, verified photo or form evidence, and pollable receipts.',
    capabilities: [
      'physical-world-verification',
      'retail-evidence',
      'price-and-inventory-checks',
      'property-and-facility-checks',
      'human-in-the-loop',
    ],
    pricing: {
      currency: 'USDC',
      acceptedCurrencies: ['USDC', 'USDT0'],
      base: '0.01',
      unit: 'integration_test',
      tiers: {
        integration_test: '0.01',
        evaluation_test: '0.10',
        quick_check: '2.00',
        photo_visit: '5.00',
        urgent_visit: '15.00',
        complex_visit: '50.00',
      },
    },
    payment: {
      address: process.env.X402_VERIFY_RECIPIENT ?? '0x72db032c0dFB6E7502e16A73fabdab31712dc706',
      chain: 'eip155:8453',
      network: 'Base',
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      facilitator: process.env.BASE_X402_FACILITATOR_URL ?? 'https://facilitator.openx402.ai',
      rails: [
        {
          chain: 'eip155:8453',
          network: 'Base',
          currency: 'USDC',
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          facilitator: process.env.BASE_X402_FACILITATOR_URL ?? 'https://facilitator.openx402.ai',
        },
        {
          chain: 'eip155:196',
          network: 'X Layer',
          currency: 'USDT0',
          asset: process.env.OKX_PAYMENT_TOKEN ?? '0x74b7F16337b8972027F6196A17a631aC6dE26d22',
          facilitator: process.env.OKX_FACILITATOR_URL ?? 'https://www.okx.com/web3/build/ai',
        },
      ],
    },
    endpoint: `${base}/api/v1/human-do`,
    method: 'POST',
    openapi: `${base}/api/openapi`,
    agentCard: `${base}/.well-known/agent-card.json`,
    evaluation: `${base}/try`,
    settlement: 'A paid call returns a task_id immediately. Physical fulfillment is asynchronous and must be polled.',
    limitations: 'Coverage and turnaround are confirmed before real field dispatch. The 0.01 tier tests the payment and task contract; it does not claim a completed field visit.',
  }, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}
