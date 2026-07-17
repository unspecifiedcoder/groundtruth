/**
 * E2E test: full autonomous x402 payment flow
 * Run with: node --experimental-vm-modules scripts/e2e-test.mjs
 * Or: npx tsx scripts/e2e-test.mjs
 */

import { ethers } from 'ethers'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const RPC_URL = 'https://testrpc.xlayer.tech'
const MUSDT_ADDRESS = '0x725cCe0916d2E8682438732fD9e79803B4fAB2BD'

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
]

function log(label, value) {
  console.log(`\n✅ ${label}`)
  if (value !== undefined) console.log('  ', typeof value === 'object' ? JSON.stringify(value, null, 2) : value)
}

function fail(label, err) {
  console.error(`\n❌ ${label}`)
  console.error('  ', err?.message ?? err)
  process.exit(1)
}

async function main() {
  const pk = process.env.SETTLEMENT_PRIVATE_KEY
  if (!pk) fail('SETTLEMENT_PRIVATE_KEY not set')

  console.log('\n=== GroundTruth E2E: Autonomous x402 Payment Flow ===\n')

  // 1. Derive agent wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const wallet = new ethers.Wallet(pk, provider)
  log('Agent wallet', wallet.address)

  // 2. Check mUSDT balance via faucet GET
  const balRes = await fetch(`${BASE_URL}/api/faucet?address=${wallet.address}`)
  if (!balRes.ok) fail('Faucet balance check failed', await balRes.text())
  const balData = await balRes.json()
  log('mUSDT balance', balData)

  // 3. If balance < 2, drip from faucet
  const balance = parseFloat(balData.balance ?? '0')
  if (balance < 2) {
    console.log('\n🔄 Balance low — dripping from faucet...')
    const dripRes = await fetch(`${BASE_URL}/api/faucet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: wallet.address }),
    })
    const dripData = await dripRes.json()
    if (!dripRes.ok && !dripData.tx) {
      console.log('  ℹ️  Faucet note:', dripData.error ?? 'may already have been dripped')
    } else {
      log('Faucet drip tx', dripData.tx)
      console.log('  Waiting 3s for balance to reflect...')
      await new Promise(r => setTimeout(r, 3000))
    }
  } else {
    log('Balance sufficient — no faucet needed', `${balance} mUSDT`)
  }

  // 4. Do a real ERC-20 transfer as x402 payment
  const musdt = new ethers.Contract(MUSDT_ADDRESS, ERC20_ABI, wallet)
  const payTo = '0x430172985b21458d73576435D4aD4bEeA85F376C' // GroundTruthPayroll contract
  const amountUnits = BigInt(2_000_000) // 2 mUSDT
  console.log('\n🔄 Sending 2 mUSDT payment on-chain...')
  const tx = await musdt.transfer(payTo, amountUnits)
  await tx.wait()
  log('Payment tx', tx.hash)
  log('Explorer', `https://www.okx.com/web3/explorer/xlayer-test/tx/${tx.hash}`)

  // 5. Build x402 payment header
  const paymentPayload = {
    from: wallet.address,
    txHash: tx.hash,
    paymentReference: `e2e-test-${Date.now()}`,
    network: 'xlayer-testnet',
    token: MUSDT_ADDRESS,
    amount: amountUnits.toString(),
  }
  const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')
  log('x402 payment header built', '(base64 JSON with txHash)')

  // 6. POST to /api/v1/human-do with X-PAYMENT header
  console.log('\n🔄 Creating task with x402 payment...')
  const taskRes = await fetch(`${BASE_URL}/api/v1/human-do`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PAYMENT': paymentHeader,
    },
    body: JSON.stringify({
      intent: 'E2E test task: verify the GroundTruth autonomous payment flow works',
      proof_spec: {
        type: 'form',
        instructions: 'Confirm the x402 payment was received and this task was created autonomously.',
      },
      budget_usdt: '2.00',
      timeout_seconds: 3600,
    }),
  })
  const taskData = await taskRes.json()
  if (!taskRes.ok) fail('Task creation failed', JSON.stringify(taskData))
  log('Task created', taskData)

  // 7. Poll task status
  const taskId = taskData.task_id
  const statusRes = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`)
  const statusData = await statusRes.json()
  log('Task status', statusData)

  console.log('\n\n✅ E2E COMPLETE — Full autonomous x402 flow verified!')
  console.log(`  Task ID: ${taskId}`)
  console.log(`  Payment tx: ${tx.hash}`)
  console.log(`  Board: ${BASE_URL}/tasks/${taskId}\n`)
}

main().catch(err => fail('Unexpected error', err))
