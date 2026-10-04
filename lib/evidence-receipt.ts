import { createPublicClient, createWalletClient, http, keccak256, parseAbi, toBytes, type Hash } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type { Task } from './types'

const RECEIPT_ABI = parseAbi([
  'function recordReceipt(bytes32 taskKey, bytes32 evidenceRoot, bytes32 proofSpecHash, bytes32 verdictHash, uint64 capturedAt)',
  'function getReceipt(bytes32 taskKey) view returns ((bytes32 evidenceRoot, bytes32 proofSpecHash, bytes32 verdictHash, uint64 capturedAt, uint64 recordedAt))',
  'function exists(bytes32 taskKey) view returns (bool)',
])

function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
  return `{${entries.join(',')}}`
}

export function buildEvidenceReceipt(task: Pick<Task, 'id' | 'proof_spec' | 'proof_payload' | 'result' | 'submitted_at'>) {
  const captured = task.proof_payload?.location?.capturedAt ?? task.proof_payload?.submittedAt ?? task.submitted_at
  const capturedAt = captured ? Math.floor(new Date(captured).getTime() / 1000) : 0
  return {
    taskKey: keccak256(toBytes(task.id)),
    evidenceRoot: keccak256(toBytes(canonical(task.proof_payload ?? {}))),
    proofSpecHash: keccak256(toBytes(canonical(task.proof_spec))),
    verdictHash: keccak256(toBytes(canonical(task.result ?? {}))),
    capturedAt,
  }
}

function config() {
  const contract = (process.env.EVIDENCE_RECEIPT_CONTRACT ?? '0xaf712732bd2c8ef589bb9fff5421ed428e4207e1') as `0x${string}`
  const key = (process.env.EVIDENCE_RECEIPT_PRIVATE_KEY ?? process.env.SETTLEMENT_PRIVATE_KEY) as `0x${string}` | undefined
  const chainId = Number(process.env.EVIDENCE_RECEIPT_CHAIN_ID ?? '421614')
  const rpc = process.env.EVIDENCE_RECEIPT_RPC ?? (chainId === 42161
    ? 'https://arb1.arbitrum.io/rpc'
    : 'https://sepolia-rollup.arbitrum.io/rpc')
  const explorer = chainId === 42161 ? 'https://arbiscan.io' : 'https://sepolia.arbiscan.io'
  return { contract, key, chainId, rpc, explorer }
}

function chain(id: number, rpc: string) {
  return {
    id,
    name: id === 42161 ? 'Arbitrum One' : 'Arbitrum Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [rpc] }, public: { http: [rpc] } },
  } as const
}

export async function anchorEvidenceReceipt(task: Task): Promise<{ txHash: Hash; explorer: string } | null> {
  const { contract, key, chainId, rpc, explorer } = config()
  if (!contract || !key) return null

  const receipt = buildEvidenceReceipt(task)
  if (!receipt.capturedAt) throw new Error('Evidence capture time is missing')
  const account = privateKeyToAccount(key)
  const selectedChain = chain(chainId, rpc)
  const publicClient = createPublicClient({ chain: selectedChain, transport: http(rpc, { timeout: 15_000 }) })
  const walletClient = createWalletClient({ account, chain: selectedChain, transport: http(rpc, { timeout: 15_000 }) })
  const alreadyExists = await publicClient.readContract({ address: contract, abi: RECEIPT_ABI, functionName: 'exists', args: [receipt.taskKey] })
  if (alreadyExists) return null

  const txHash = await walletClient.writeContract({
    address: contract,
    abi: RECEIPT_ABI,
    functionName: 'recordReceipt',
    args: [receipt.taskKey, receipt.evidenceRoot, receipt.proofSpecHash, receipt.verdictHash, BigInt(receipt.capturedAt)],
    account,
  })
  await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 })
  return { txHash, explorer: `${explorer}/tx/${txHash}` }
}

export async function readEvidenceReceipt(taskId: string) {
  const { contract, chainId, rpc, explorer } = config()
  if (!contract) return null
  const selectedChain = chain(chainId, rpc)
  const publicClient = createPublicClient({ chain: selectedChain, transport: http(rpc, { timeout: 15_000 }) })
  const taskKey = keccak256(toBytes(taskId))
  const exists = await publicClient.readContract({ address: contract, abi: RECEIPT_ABI, functionName: 'exists', args: [taskKey] })
  if (!exists) return { exists: false, taskKey, contract, chainId, explorer }
  const receipt = await publicClient.readContract({ address: contract, abi: RECEIPT_ABI, functionName: 'getReceipt', args: [taskKey] })
  return {
    exists: true,
    taskKey,
    contract,
    chainId,
    network: chainId === 42161 ? 'Arbitrum One' : 'Arbitrum Sepolia',
    explorer: `${explorer}/address/${contract}`,
    evidenceRoot: receipt.evidenceRoot,
    proofSpecHash: receipt.proofSpecHash,
    verdictHash: receipt.verdictHash,
    capturedAt: Number(receipt.capturedAt),
    recordedAt: Number(receipt.recordedAt),
  }
}
