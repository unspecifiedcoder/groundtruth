import { createPublicClient, createWalletClient, http, parseAbi, type Hash } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// X Layer mainnet (chainId 196)
export const xlayer = {
  id: 196,
  name: 'X Layer',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.xlayer.tech'] },
    public:  { http: ['https://rpc.xlayer.tech'] },
  },
  blockExplorers: {
    default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer' },
  },
} as const

const PAYROLL_ABI = parseAbi([
  'function settle(bytes32 taskKey, address worker, address token, uint256 payoutAmount, uint256 feeAmount) external',
  'function settled(bytes32) view returns (bool)',
  'event TaskSettled(bytes32 indexed taskKey, address indexed worker, address token, uint256 payoutAmount, uint256 feeAmount, address feeRecipient)',
])

export function getPublicClient() {
  return createPublicClient({ chain: xlayer, transport: http() })
}

function getWalletClient() {
  const pk = process.env.SETTLEMENT_PRIVATE_KEY
  if (!pk) throw new Error('SETTLEMENT_PRIVATE_KEY not set')
  const account = privateKeyToAccount(pk as `0x${string}`)
  return { client: createWalletClient({ account, chain: xlayer, transport: http() }), account }
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
  const hash = await client.writeContract({
    address: params.contractAddress,
    abi: PAYROLL_ABI,
    functionName: 'settle',
    args: [
      params.taskKey,
      params.workerAddress,
      params.tokenAddress,
      params.payoutUnits,
      params.feeUnits,
    ],
    account,
  })
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
