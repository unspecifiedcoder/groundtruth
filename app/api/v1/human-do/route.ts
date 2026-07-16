import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // x402 payment stub — always return 402 challenge
  void req.json().catch(() => ({}))

  return NextResponse.json(
    {
      x402Version: 1,
      accepts: [
        {
          scheme: 'exact',
          network: process.env.OKX_PAYMENT_NETWORK ?? '196',
          maxAmountRequired: '2000000',
          resource: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/v1/human-do`,
          description: 'GroundTruth task creation fee',
          mimeType: 'application/json',
          payTo: process.env.OKX_PAYMENT_TOKEN ?? '0x0000000000000000000000000000000000000000',
          maxTimeoutSeconds: 300,
          asset: process.env.OKX_PAYMENT_TOKEN ?? '0x0000000000000000000000000000000000000000',
          extra: {
            name: 'GroundTruth Task',
            version: '1',
          },
        },
      ],
      error: 'Payment required',
    },
    { status: 402 }
  )
}
