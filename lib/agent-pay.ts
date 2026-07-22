import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { toUnits } from './money'

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
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
])

export interface AgentPayResult {
  success: boolean
  agentAddress: string
  balanceBefore: string
  faucetTx?: string
  paymentTx?: string   // undefined in x402 exact mode (facilitator settles server-side)
  paymentHeader: string
  steps: string[]
}

export async function agentPay(amountUsdt: string, payTo: string, appUrl: string): Promise<AgentPayResult> {
  // The paying agent should be a DISTINCT wallet from the settlement operator,
  // so the on-chain trail reads agent → contract → worker (a real market), not
  // one key paying itself. Set AGENT_PRIVATE_KEY to a separately-funded wallet;
  // falls back to the settlement key only if unset.
  const pk = (process.env.AGENT_PRIVATE_KEY ?? process.env.SETTLEMENT_PRIVATE_KEY) as Hex | undefined
  if (!pk) throw new Error('No agent wallet configured (set AGENT_PRIVATE_KEY or SETTLEMENT_PRIVATE_KEY)')

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
  // Precise integer conversion (6 decimals) — avoids floating-point rounding.
  const amountUnits = toUnits(amountUsdt)

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

  // Step 3+4: build the x402 payment.
  // Default is the SPEC-FAITHFUL "exact" scheme via Permit2: the agent SIGNS an
  // authorization (never sends the tokens); the facilitator settles it on-chain.
  // Set X402_EXACT=false for the legacy direct-transfer path.
  const useExact = process.env.X402_EXACT !== 'false'
  let paymentTx: string | undefined
  let paymentHeader: string

  if (useExact) {
    const { signX402Payment, PERMIT2_ADDRESS } = await import('./x402')
    const { privateKeyToAccount } = await import('viem/accounts')
    const operator = privateKeyToAccount(process.env.SETTLEMENT_PRIVATE_KEY as `0x${string}`).address

    // One-time: approve Permit2 to move the agent's mUSDT.
    const allowance = await publicClient.readContract({
      address: MUSDT_ADDRESS, abi: ERC20_ABI, functionName: 'allowance', args: [agentAddress, PERMIT2_ADDRESS],
    }) as bigint
    if (allowance < amountUnits) {
      steps.push('Approving Permit2 (one-time)...')
      const ap = await walletClient.writeContract({ address: MUSDT_ADDRESS, abi: ERC20_ABI, functionName: 'approve', args: [PERMIT2_ADDRESS, (1n << 256n) - 1n] })
      await publicClient.waitForTransactionReceipt({ hash: ap, timeout: 60_000 })
    }

    steps.push('Signing x402 (exact/Permit2) payment authorization...')
    const signed = await signX402Payment(pk, { token: MUSDT_ADDRESS, amount: amountUnits.toString(), payTo: payTo as `0x${string}`, spender: operator })
    paymentHeader = signed.header
    steps.push('x402 authorization signed — the facilitator will verify and settle on-chain.')
  } else {
    steps.push(`Sending ${amountUsdt} mUSDT payment on-chain (legacy transfer)...`)
    const txHash = await walletClient.writeContract({ address: MUSDT_ADDRESS, abi: ERC20_ABI, functionName: 'transfer', args: [payTo as `0x${string}`, amountUnits] })
    await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 })
    paymentTx = txHash
    steps.push(`Payment tx confirmed: ${paymentTx}`)
    paymentHeader = Buffer.from(JSON.stringify({ from: agentAddress, txHash, paymentReference: `agent-pay-${Date.now()}`, network: 'xlayer-testnet', token: MUSDT_ADDRESS, amount: amountUnits.toString() })).toString('base64')
  }

  return { success: true, agentAddress, balanceBefore, faucetTx, paymentTx, paymentHeader, steps }
}
