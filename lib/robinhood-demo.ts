import { createPublicClient, defineChain, http, parseAbi } from 'viem'

export const ROBINHOOD_TESTNET_CHAIN_ID = 46630
export const ROBINHOOD_TESTNET_RPC = 'https://rpc.testnet.chain.robinhood.com'
export const ROBINHOOD_TESTNET_EXPLORER = 'https://explorer.testnet.chain.robinhood.com'
export const ROBINHOOD_USDG = '0x7E955252E15c84f5768B83c41a71F9eba181802F' as const
export const ROBINHOOD_RECEIPT_REGISTRY = '0x430172985b21458d73576435d4ad4beea85f376c' as const
export const ROBINHOOD_USDG_ESCROW = '0x725cce0916d2e8682438732fd9e79803b4fab2bd' as const
export const ROBINHOOD_DEMO_TASK_KEY = '0x41469d468fbf89a1b4fcdb07becb5ec7fafde4942256d657faa13088856d7e7a' as const

const chain = defineChain({
  id: ROBINHOOD_TESTNET_CHAIN_ID,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [ROBINHOOD_TESTNET_RPC] } },
  blockExplorers: { default: { name: 'Robinhood Testnet Explorer', url: ROBINHOOD_TESTNET_EXPLORER } },
})

const registryAbi = parseAbi([
  'function exists(bytes32 taskKey) view returns (bool)',
  'function getReceipt(bytes32 taskKey) view returns ((bytes32 evidenceRoot, bytes32 proofSpecHash, bytes32 verdictHash, uint64 capturedAt, uint64 recordedAt))',
])

const escrowAbi = parseAbi([
  'function getTask(bytes32 taskKey) view returns ((address payer, address recipient, uint128 amount, uint8 status, bytes32 proofSpecHash, bytes32 evidenceRoot, bytes32 verdictHash, uint64 fundedAt, uint64 resolvedAt))',
])

export async function readRobinhoodDemo() {
  const client = createPublicClient({ chain, transport: http(ROBINHOOD_TESTNET_RPC, { timeout: 15_000 }) })
  const [exists, receipt, task] = await Promise.all([
    client.readContract({ address: ROBINHOOD_RECEIPT_REGISTRY, abi: registryAbi, functionName: 'exists', args: [ROBINHOOD_DEMO_TASK_KEY] }),
    client.readContract({ address: ROBINHOOD_RECEIPT_REGISTRY, abi: registryAbi, functionName: 'getReceipt', args: [ROBINHOOD_DEMO_TASK_KEY] }),
    client.readContract({ address: ROBINHOOD_USDG_ESCROW, abi: escrowAbi, functionName: 'getTask', args: [ROBINHOOD_DEMO_TASK_KEY] }),
  ])

  return {
    network: chain.name,
    chainId: chain.id,
    exists,
    taskKey: ROBINHOOD_DEMO_TASK_KEY,
    currency: 'USDG',
    asset: ROBINHOOD_USDG,
    amountAtomic: task.amount.toString(),
    amount: `${Number(task.amount) / 1_000_000} USDG`,
    status: Number(task.status) === 2 ? 'settled' : Number(task.status) === 1 ? 'funded' : Number(task.status) === 3 ? 'refunded' : 'none',
    payer: task.payer,
    recipient: task.recipient,
    proofSpecHash: task.proofSpecHash,
    evidenceRoot: task.evidenceRoot,
    verdictHash: task.verdictHash,
    fundedAt: Number(task.fundedAt),
    resolvedAt: Number(task.resolvedAt),
    receipt: {
      evidenceRoot: receipt.evidenceRoot,
      proofSpecHash: receipt.proofSpecHash,
      verdictHash: receipt.verdictHash,
      capturedAt: Number(receipt.capturedAt),
      recordedAt: Number(receipt.recordedAt),
    },
    contracts: {
      registry: ROBINHOOD_RECEIPT_REGISTRY,
      escrow: ROBINHOOD_USDG_ESCROW,
    },
    explorers: {
      registry: `${ROBINHOOD_TESTNET_EXPLORER}/address/${ROBINHOOD_RECEIPT_REGISTRY}`,
      escrow: `${ROBINHOOD_TESTNET_EXPLORER}/address/${ROBINHOOD_USDG_ESCROW}`,
      funding: `${ROBINHOOD_TESTNET_EXPLORER}/tx/0x7484c4b08116443ff373cedd1fe538fd6dea6980da33dcea357c952dd5b50cbf`,
      receipt: `${ROBINHOOD_TESTNET_EXPLORER}/tx/0xe40962487564871146b878b3398e97f7388a70975e7e885ead9e4dc60e5ba9c1`,
      settlement: `${ROBINHOOD_TESTNET_EXPLORER}/tx/0x0f055da7c51d942f14dfcb3b224b3f598d7a6ba8a7dd479f77bb49346f00e772`,
    },
    boundary: 'Protocol demonstration on testnet. It is not customer revenue or proof of physical fulfillment.',
  }
}
