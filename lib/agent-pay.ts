import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const XLAYER_TESTNET = {
  id: 1952,
  name: 'X Layer Testnet',
  network: 'xlayer-testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: { default: { http: ['https://testrpc.xlayer.tech'] } },
} as const

const MUSDT_ADDRESS = '0x725cCe0916d2E8682438732fD9e79803B4fAB2BD' as const
const MUSDT_DECIMALS = 6

const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
])

export interface AgentPayResult {
  success: boolean
  agentAddress: string
  balanceBefore: string
  faucetTx?: string
  paymentTx: string
  paymentHeader: string
  steps: string[]
}

export async function agentPay(amountUsdt: string, payTo: string, appUrl: string): Promise<AgentPayResult> {
  const pk = process.env.SETTLEMENT_PRIVATE_KEY as Hex | undefined
  if (!pk) throw new Error('No agent wallet configured (SETTLEMENT_PRIVATE_KEY missing)')

  const steps: string[] = []
  const account = privateKeyToAccount(pk)
  const agentAddress = account.address

  const publicClient = createPublicClient({
    chain: XLAYER_TESTNET,
    transport: http(),
  })
  const walletClient = createWalletClient({
    account,
    chain: XLAYER_TESTNET,
    transport: http(),
  })

  // Step 1: Check mUSDT balance
  const balanceRaw = await publicClient.readContract({
    address: MUSDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [agentAddress],
  })
  const balanceBefore = (Number(balanceRaw) / 10 ** MUSDT_DECIMALS).toFixed(2)
  const amountUnits = BigInt(Math.round(Number(amountUsdt) * 10 ** MUSDT_DECIMALS))

  steps.push(`Agent wallet: ${agentAddress}`)
  steps.push(`mUSDT balance: ${balanceBefore} (need ${amountUsdt})`)

  // Step 2: Drip from faucet if balance is low
  let faucetTx: string | undefined
  if (balanceRaw < amountUnits) {
    steps.push('Balance insufficient — requesting mUSDT from faucet...')
    try {
      const faucetRes = await fetch(`${appUrl}/api/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: agentAddress }),
        signal: AbortSignal.timeout(30_000),
      })
      const faucetData = await faucetRes.json()
      if (faucetRes.ok && faucetData.tx) {
        faucetTx = faucetData.tx
        steps.push(`Faucet drip confirmed: ${faucetTx}`)
        await new Promise(r => setTimeout(r, 3000))
      } else {
        steps.push(`Faucet note: ${faucetData.error ?? 'already dripped recently'}`)
      }
    } catch {
      steps.push('Faucet unreachable — proceeding with existing balance')
    }
  } else {
    steps.push('Sufficient balance — no faucet needed')
  }

  // Step 3: Transfer mUSDT as real on-chain payment
  steps.push(`Sending ${amountUsdt} mUSDT payment on-chain...`)
  const txHash = await walletClient.writeContract({
    address: MUSDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [payTo as `0x${string}`, amountUnits],
  })

  await publicClient.waitForTransactionReceipt({ hash: txHash })
  const paymentTx = txHash
  steps.push(`Payment tx confirmed: ${paymentTx}`)

  // Step 4: Build x402 payment header (parseFallback reads {from, txHash, paymentReference})
  const paymentPayload = {
    from: agentAddress,
    txHash: paymentTx,
    paymentReference: `agent-pay-${Date.now()}`,
    network: 'xlayer-testnet',
    token: MUSDT_ADDRESS,
    amount: amountUnits.toString(),
  }
  const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')

  steps.push('x402 payment header built — submitting task...')

  return {
    success: true,
    agentAddress,
    balanceBefore,
    faucetTx,
    paymentTx,
    paymentHeader,
    steps,
  }
}
