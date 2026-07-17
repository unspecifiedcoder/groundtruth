import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

const MOCK_USDT_ADDRESS = '0x725cCe0916d2E8682438732fD9e79803B4fAB2BD'
const RPC_URL = 'https://testrpc.xlayer.tech'

const ABI = [
  'function drip(address to) external',
  'function balanceOf(address) view returns (uint256)',
  'function lastFaucetTime(address) view returns (uint256)',
]

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json()
    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const pk = process.env.SETTLEMENT_PRIVATE_KEY
    if (!pk) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const signer = new ethers.Wallet(pk, provider)
    const contract = new ethers.Contract(MOCK_USDT_ADDRESS, ABI, signer)

    // Check cooldown
    const lastTime: bigint = await contract.lastFaucetTime(address)
    const now = BigInt(Math.floor(Date.now() / 1000))
    const cooldown = BigInt(3600) // 1 hour
    if (lastTime > 0n && now < lastTime + cooldown) {
      const waitMins = Number((lastTime + cooldown - now) / 60n)
      return NextResponse.json(
        { error: `Cooldown active. Try again in ${waitMins} minutes.` },
        { status: 429 }
      )
    }

    const tx = await contract.drip(address)
    await tx.wait()

    return NextResponse.json({
      success: true,
      tx: tx.hash,
      amount: '10 mUSDT',
      token: MOCK_USDT_ADDRESS,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  if (!address || !ethers.isAddress(address)) {
    return NextResponse.json({ token: MOCK_USDT_ADDRESS, symbol: 'mUSDT', decimals: 6 })
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const contract = new ethers.Contract(MOCK_USDT_ADDRESS, ABI, provider)
  const balance: bigint = await contract.balanceOf(address)

  return NextResponse.json({
    token: MOCK_USDT_ADDRESS,
    symbol: 'mUSDT',
    decimals: 6,
    balance: (Number(balance) / 1e6).toFixed(2),
  })
}
