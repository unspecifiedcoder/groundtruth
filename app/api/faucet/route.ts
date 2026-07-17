import { NextRequest, NextResponse } from 'next/server'
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  parseAbi,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const MOCK_USDT_ADDRESS = '0x725cCe0916d2E8682438732fD9e79803B4fAB2BD' as const

const XLAYER_TESTNET = {
  id: 1952,
  name: 'X Layer Testnet',
  network: 'xlayer-testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: { default: { http: ['https://testrpc.xlayer.tech'] } },
} as const

const ABI = parseAbi([
  'function drip(address to) external',
  'function balanceOf(address) view returns (uint256)',
  'function lastFaucetTime(address) view returns (uint256)',
])

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json()
    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const pk = process.env.SETTLEMENT_PRIVATE_KEY as Hex | undefined
    if (!pk) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

    const account = privateKeyToAccount(pk)
    const publicClient = createPublicClient({ chain: XLAYER_TESTNET, transport: http() })
    const walletClient = createWalletClient({ account, chain: XLAYER_TESTNET, transport: http() })

    // Check cooldown
    const lastTime = await publicClient.readContract({
      address: MOCK_USDT_ADDRESS,
      abi: ABI,
      functionName: 'lastFaucetTime',
      args: [address as `0x${string}`],
    })
    const now = BigInt(Math.floor(Date.now() / 1000))
    const cooldown = BigInt(3600)
    if (lastTime > 0n && now < lastTime + cooldown) {
      const waitMins = Number((lastTime + cooldown - now) / 60n)
      return NextResponse.json(
        { error: `Cooldown active. Try again in ${waitMins} minutes.` },
        { status: 429 }
      )
    }

    const txHash = await walletClient.writeContract({
      address: MOCK_USDT_ADDRESS,
      abi: ABI,
      functionName: 'drip',
      args: [address as `0x${string}`],
    })
    await publicClient.waitForTransactionReceipt({ hash: txHash })

    return NextResponse.json({
      success: true,
      tx: txHash,
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
  if (!address || !isAddress(address)) {
    return NextResponse.json({ token: MOCK_USDT_ADDRESS, symbol: 'mUSDT', decimals: 6 })
  }

  const publicClient = createPublicClient({ chain: XLAYER_TESTNET, transport: http() })
  const balance = await publicClient.readContract({
    address: MOCK_USDT_ADDRESS,
    abi: ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  })

  return NextResponse.json({
    token: MOCK_USDT_ADDRESS,
    symbol: 'mUSDT',
    decimals: 6,
    balance: (Number(balance) / 1e6).toFixed(2),
  })
}
