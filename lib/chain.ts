import { createPublicClient, createWalletClient, http, parseAbi, getAddress, type Hash } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// Workers paste their own wallet, so casing is whatever they typed. viem rejects
// any mixed-case address that fails EIP-55 checksum — lowercasing first lets
// getAddress re-derive the correct checksum instead of blocking the payout.
export function normalizeAddress(addr: string): `0x${string}` {
  return getAddress(addr.toLowerCase())
}

// Settlement network. Everything (payments, payroll contract, mUSDT) lives on
// X Layer testnet, so settlement defaults there too. Overridable via env for a
// mainnet deployment.
const CHAIN_ID = Number(process.env.SETTLEMENT_CHAIN_ID ?? '1952')
const RPC = process.env.SETTLEMENT_RPC ?? 'https://testrpc.xlayer.tech'
const EXPLORER = process.env.SETTLEMENT_EXPLORER ?? 'https://www.oklink.com/xlayer-test'

export const xlayer = {
  id: CHAIN_ID,
  name: CHAIN_ID === 196 ? 'X Layer' : 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: { default: { http: [RPC] }, public: { http: [RPC] } },
  blockExplorers: { default: { name: 'OKLink', url: EXPLORER } },
} as const

export function explorerTx(hash: string): string {
  return `${EXPLORER}/tx/${hash}`
}

const PAYROLL_ABI = parseAbi([
  'function settle(bytes32 taskKey, address worker, address token, uint256 payoutAmount, uint256 feeAmount) external',
  'function settled(bytes32) view returns (bool)',
])

const ERC20_ABI = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
])

export function getPublicClient() {
  return createPublicClient({ chain: xlayer, transport: http(RPC, { timeout: 15_000 }) })
}

function getWalletClient() {
  const pk = process.env.SETTLEMENT_PRIVATE_KEY
  if (!pk) throw new Error('SETTLEMENT_PRIVATE_KEY not set')
  const account = privateKeyToAccount(pk as `0x${string}`)
  return { client: createWalletClient({ account, chain: xlayer, transport: http(RPC, { timeout: 15_000 }) }), account }
}

// Once we've confirmed the operator has approved the payroll contract for a
// token, remember it for this server instance so later settlements skip the
// allowance round-trip (approval is a one-time max-approval).
const approvedTokens = new Set<string>()

// The payroll contract pays out via transferFrom(operator, …), so the operator
// must approve the contract for the token. Approve once (max) if needed.
async function ensureApproval(
  token: `0x${string}`,
  spender: `0x${string}`,
  owner: `0x${string}`,
  needed: bigint,
  client: ReturnType<typeof getWalletClient>['client'],
  account: ReturnType<typeof getWalletClient>['account']
): Promise<void> {
  const cacheKey = `${token}:${spender}:${owner}`.toLowerCase()
  if (approvedTokens.has(cacheKey)) return
  const pub = getPublicClient()
  const allowance = await pub.readContract({ address: token, abi: ERC20_ABI, functionName: 'allowance', args: [owner, spender] })
  if (allowance >= needed) { approvedTokens.add(cacheKey); return }
  const tx = await client.writeContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, (1n << 256n) - 1n],
    account,
  })
  await pub.waitForTransactionReceipt({ hash: tx, timeout: 60_000 })
  approvedTokens.add(cacheKey)
}

export async function settleOnChain(params: {
  contractAddress: `0x${string}`
  taskKey: `0x${string}`
  workerAddress: `0x${string}`
  tokenAddress: `0x${string}`
  payoutUnits: bigint
  feeUnits: bigint
}): Promise<Hash> {
  const { client, account } = getWalletClient()
  const worker = normalizeAddress(params.workerAddress)
  const pub = getPublicClient()

  // No payroll contract on this chain (e.g. mainnet, where only the operator
  // wallet — not the testnet-only contract — actually holds the captured
  // payment) — pay the worker directly from the operator's own balance instead
  // of calling a contract that doesn't exist here. The fee simply stays in the
  // operator wallet since it's never transferred out.
  const code = await pub.getBytecode({ address: params.contractAddress }).catch(() => undefined)
  if (!code) {
    const hash = await client.writeContract({
      address: params.tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [worker, params.payoutUnits],
      account,
    })
    await pub.waitForTransactionReceipt({ hash, timeout: 60_000 })
    return hash
  }

  await ensureApproval(params.tokenAddress, params.contractAddress, account.address, params.payoutUnits + params.feeUnits, client, account)
  const hash = await client.writeContract({
    address: params.contractAddress,
    abi: PAYROLL_ABI,
    functionName: 'settle',
    args: [params.taskKey, worker, params.tokenAddress, params.payoutUnits, params.feeUnits],
    account,
  })
  await pub.waitForTransactionReceipt({ hash, timeout: 60_000 })
  return hash
}

export async function isSettled(
  contractAddress: `0x${string}`,
  taskKey: `0x${string}`
): Promise<boolean> {
  const client = getPublicClient()
  return client.readContract({
    address: contractAddress,
    abi: PAYROLL_ABI,
    functionName: 'settled',
    args: [taskKey],
  })
}
