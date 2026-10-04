import fs from 'node:fs'
import path from 'node:path'
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  keccak256,
  parseAbi,
  toBytes,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const ROOT = process.cwd()
const RPC = 'https://rpc.testnet.chain.robinhood.com'
const EXPLORER = 'https://explorer.testnet.chain.robinhood.com'
const USDG = '0x7E955252E15c84f5768B83c41a71F9eba181802F'
const CHAIN_ID = 46630
const DEMO_AMOUNT = 1_000_000n // 1 USDG, 6 decimals

function envFile(file) {
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter(line => line && !line.startsWith('#') && line.includes('='))
      .map(line => {
        const index = line.indexOf('=')
        return [line.slice(0, index), line.slice(index + 1).trim()]
      }),
  )
}

function artifact(name) {
  const prefix = path.join(ROOT, 'tmp', 'robinhood-build', name)
  return {
    abi: JSON.parse(fs.readFileSync(`${prefix}.abi`, 'utf8')),
    bytecode: `0x${fs.readFileSync(`${prefix}.bin`, 'utf8').trim()}`,
  }
}

const env = envFile(path.join(ROOT, '.env.local'))
if (!env.PRIVATE_KEY) throw new Error('PRIVATE_KEY is required in .env.local')
const key = env.PRIVATE_KEY.startsWith('0x') ? env.PRIVATE_KEY : `0x${env.PRIVATE_KEY}`
const account = privateKeyToAccount(key)
const chain = defineChain({
  id: CHAIN_ID,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
  blockExplorers: { default: { name: 'Robinhood Testnet Explorer', url: EXPLORER } },
})
const publicClient = createPublicClient({ chain, transport: http(RPC, { timeout: 30_000 }) })
const walletClient = createWalletClient({ account, chain, transport: http(RPC, { timeout: 30_000 }) })

if (await publicClient.getChainId() !== CHAIN_ID) throw new Error('Wrong chain')
const nativeBalance = await publicClient.getBalance({ address: account.address })
if (nativeBalance === 0n) throw new Error('Robinhood testnet ETH is required')
const usdgCode = await publicClient.getCode({ address: USDG })
if (!usdgCode || usdgCode === '0x') throw new Error('Official Robinhood testnet USDG contract is missing')

const registryArtifact = artifact('contracts_src_EvidenceReceiptRegistry_sol_EvidenceReceiptRegistry')
const escrowArtifact = artifact('contracts_src_GroundTruthUSDGTaskEscrow_sol_GroundTruthUSDGTaskEscrow')

async function deploy(abi, bytecode, args) {
  const hash = await walletClient.deployContract({ abi, bytecode, args, account })
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 90_000 })
  if (receipt.status !== 'success' || !receipt.contractAddress) throw new Error(`Deployment failed: ${hash}`)
  return { hash, address: receipt.contractAddress, blockNumber: receipt.blockNumber }
}

const registry = await deploy(registryArtifact.abi, registryArtifact.bytecode, [account.address])
const escrow = await deploy(escrowArtifact.abi, escrowArtifact.bytecode, [USDG, account.address])

const erc20Abi = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
])
const escrowAbi = escrowArtifact.abi
const registryAbi = registryArtifact.abi
const usdgBalance = await publicClient.readContract({ address: USDG, abi: erc20Abi, functionName: 'balanceOf', args: [account.address] })
if (usdgBalance < DEMO_AMOUNT) throw new Error('At least 1 test USDG is required')

async function write(address, abi, functionName, args) {
  const hash = await walletClient.writeContract({ address, abi, functionName, args, account })
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 90_000 })
  if (receipt.status !== 'success') throw new Error(`${functionName} failed: ${hash}`)
  return { hash, blockNumber: receipt.blockNumber }
}

const taskKey = keccak256(toBytes('groundtruth-robinhood-usdg-demo-2026-10-04'))
const proofSpecHash = keccak256(toBytes('Verify one retail shelf, displayed price, and promotion marker'))
const evidenceRoot = keccak256(toBytes('labeled-protocol-demo-evidence-package'))
const verdictHash = keccak256(toBytes('accepted:all-required-checks-passed'))
const capturedAt = BigInt(Math.floor(Date.now() / 1000) - 60)

const approval = await write(USDG, erc20Abi, 'approve', [escrow.address, DEMO_AMOUNT])
const funding = await write(escrow.address, escrowAbi, 'fundTask', [taskKey, account.address, DEMO_AMOUNT, proofSpecHash])
const receiptWrite = await write(registry.address, registryAbi, 'recordReceipt', [taskKey, evidenceRoot, proofSpecHash, verdictHash, capturedAt])
const settlement = await write(escrow.address, escrowAbi, 'settleTask', [taskKey, evidenceRoot, verdictHash])

const result = {
  network: 'Robinhood Chain Testnet',
  chainId: CHAIN_ID,
  deployer: account.address,
  usdg: USDG,
  demoAmount: '1.000000 USDG',
  taskKey,
  registry: {
    address: registry.address,
    deploymentTx: registry.hash,
    explorer: `${EXPLORER}/address/${registry.address}`,
  },
  escrow: {
    address: escrow.address,
    deploymentTx: escrow.hash,
    explorer: `${EXPLORER}/address/${escrow.address}`,
  },
  transactions: {
    approval: approval.hash,
    funding: funding.hash,
    receipt: receiptWrite.hash,
    settlement: settlement.hash,
  },
}

console.log(JSON.stringify(result, null, 2))
