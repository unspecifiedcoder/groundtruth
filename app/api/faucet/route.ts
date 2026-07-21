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

// In-memory per-IP rate limit. The settlement wallet spends real gas on every
// drip, so an unbounded stream of fresh addresses would drain it. This caps
// requests per IP; the on-chain per-recipient cooldown remains the primary
// anti-abuse control. (Best-effort only — resets on cold start / per instance.)
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 5
const ipHits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (ipHits.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS)
  hits.push(now)
  ipHits.set(ip, hits)
  return hits.length > RATE_MAX
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  return fwd ? fwd.split(',')[0].trim() : (req.headers.get('x-real-ip') ?? 'unknown')
}

export async function POST(req: NextRequest) {
  try {
    if (rateLimited(clientIp(req))) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

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
    await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 })

    return NextResponse.json({
      success: true,
      tx: txHash,
      amount: '10 mUSDT',
      token: MOCK_USDT_ADDRESS,
    })
  } catch (err: unknown) {
    // Log details server-side; return a generic message so internal RPC/chain
    // details are not disclosed to unauthenticated callers.
    console.error('[faucet] drip failed:', err)
    return NextResponse.json({ error: 'Faucet temporarily unavailable' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  if (!address || !isAddress(address)) {
    return NextResponse.json({ token: MOCK_USDT_ADDRESS, symbol: 'mUSDT', decimals: 6 })
  }

  try {
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
  } catch (err) {
    // RPC hiccup — return metadata without a balance rather than a 500.
    console.error('[faucet] balance lookup failed:', err)
    return NextResponse.json(
      { token: MOCK_USDT_ADDRESS, symbol: 'mUSDT', decimals: 6, balance: null, error: 'balance unavailable' },
      { status: 200 }
    )
  }
}
