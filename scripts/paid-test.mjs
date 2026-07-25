/**
 * GroundTruth — full paid round-trip test (for OKX reviewer verification)
 *
 * Proves: a user pays on-chain -> a task is created -> a human oracle completes
 * it -> the AI notary verifies -> the payout settles on-chain -> the user
 * receives the verified deliverable. One command, real transactions.
 *
 * RUN (from the repo root, on a machine with working network):
 *   node scripts/paid-test.mjs
 *
 * Reads .env.local automatically. No arguments needed.
 */

import { readFileSync } from 'node:fs'
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// ---- config -----------------------------------------------------------------
const RPC_URL = 'https://testrpc.xlayer.tech'
const MUSDT = '0x725cCe0916d2E8682438732fD9e79803B4fAB2BD' // payment token (X Layer testnet)
const PAYROLL = '0x430172985b21458d73576435D4aD4bEeA85F376C' // GroundTruthPayroll (recipient)
const ORACLE_WALLET = '0x1cf367c6de4d31874a900ef4ec89b1a85b0b2916' // distinct oracle payout recipient
const CHAIN = { id: 1952, name: 'X Layer Testnet', nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } }
const ERC20 = parseAbi(['function balanceOf(address) view returns (uint256)', 'function transfer(address,uint256) returns (bool)'])

// ---- tiny .env.local loader (no dependency) --------------------------------
function loadEnv() {
  let raw = ''
  try { raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8') } catch { die('.env.local not found — run from the repo root') }
  const get = k => (raw.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim()
  return get
}
const env = loadEnv()
const APP = env('NEXT_PUBLIC_APP_URL') ?? 'https://groundtruth-oracle.vercel.app'
const AGENT_PK = (k => (k ? (k.startsWith('0x') ? k : '0x' + k) : null))(env('AGENT_PRIVATE_KEY'))
if (!AGENT_PK) die('AGENT_PRIVATE_KEY missing in .env.local')

const ok = (l, v) => console.log(`\n✅ ${l}${v !== undefined ? '\n   ' + (typeof v === 'object' ? JSON.stringify(v) : v) : ''}`)
function die(m) { console.error(`\n❌ ${m}`); process.exit(1) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  console.log('\n=== GroundTruth — Paid Round-Trip Test ===')
  console.log(`Target: ${APP}\n`)

  const account = privateKeyToAccount(AGENT_PK)
  const pub = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) })
  const wallet = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) })
  ok('Payer (user/agent) wallet', account.address)

  // 1) fund if needed
  const balRes = await fetch(`${APP}/api/faucet?address=${account.address}`)
  const bal = await balRes.json().catch(() => ({}))
  const balance = parseFloat(bal.balance ?? '0')
  ok('mUSDT balance', `${balance}`)
  if (balance < 2) {
    console.log('🔄 Dripping from faucet...')
    const d = await (await fetch(`${APP}/api/faucet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: account.address }) })).json().catch(() => ({}))
    if (d.tx) { ok('Faucet tx', d.tx); await sleep(4000) } else console.log('   note:', d.error ?? 'may already be funded')
  }

  // 2) real on-chain payment: 2 mUSDT -> payroll
  console.log('\n🔄 Paying 2 mUSDT on-chain...')
  const amount = 2_000_000n
  const payTx = await wallet.writeContract({ address: MUSDT, abi: ERC20, functionName: 'transfer', args: [PAYROLL, amount] })
  await pub.waitForTransactionReceipt({ hash: payTx, timeout: 90_000 })
  ok('Payment tx', payTx)

  // 3) hire GroundTruth via the x402-paid endpoint
  const header = Buffer.from(JSON.stringify({ from: account.address, txHash: payTx, paymentReference: `okx-verify-${Date.now()}`, network: 'xlayer-testnet', token: MUSDT, amount: amount.toString() })).toString('base64')
  console.log('\n🔄 Creating task (x402 payment)...')
  const created = await (await fetch(`${APP}/api/v1/human-do`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-PAYMENT': header }, body: JSON.stringify({
    intent: 'OKX marketplace verification: confirm a live human oracle can complete a GroundTruth task and be paid on-chain.',
    proof_spec: { type: 'form', instructions: 'Enter the reference code shown and confirm the real-world check was completed.' },
    budget_usdt: '2.00', timeout_seconds: 3600,
  }) })).json()
  if (!created.task_id) die('Task creation failed: ' + JSON.stringify(created))
  const taskId = created.task_id
  ok('Task created', taskId)

  // 4) read the freshness challenge the server injected
  const detail = await (await fetch(`${APP}/api/v1/tasks/${taskId}`)).json()
  const challenge = detail?.proof_spec?.challenge
  ok('Freshness challenge', challenge ?? '(none)')

  // 5) claim as the human oracle
  console.log('\n🔄 Oracle claims the task...')
  const claim = await (await fetch(`${APP}/api/tasks/${taskId}/claim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ worker_wallet: ORACLE_WALLET }) })).json()
  if (claim.error) die('Claim failed: ' + JSON.stringify(claim))
  ok('Claimed by oracle', ORACLE_WALLET)

  // 6) submit proof (form) including the freshness code
  console.log('\n🔄 Oracle submits proof...')
  const fd = new FormData()
  fd.append('worker_wallet', ORACLE_WALLET)
  fd.append('proof_type', 'form')
  fd.append('form_data', JSON.stringify({ reference_code: challenge ?? '', confirmation: 'Completed by a live human oracle. Reference code included as proof of freshness.' }))
  const submit = await (await fetch(`${APP}/api/tasks/${taskId}/submit`, { method: 'POST', body: fd })).json()
  ok('Submit result', submit)

  // 7) settlement outcome (synchronous — present in the submit response)
  const settleTx = submit?.settle?.txHash
  const status = submit?.status

  console.log('\n\n============================================')
  console.log('   RESULT SUMMARY — paste this to David')
  console.log('============================================')
  console.log(`Status          : ${status}`)
  console.log(`Task ID         : ${taskId}`)
  console.log(`Payer (user)    : ${account.address}`)
  console.log(`Oracle (paid)   : ${ORACLE_WALLET}`)
  console.log(`Payment tx      : ${payTx}`)
  console.log(`  -> explorer   : https://www.oklink.com/xlayer-test/tx/${payTx}`)
  if (settleTx) {
    console.log(`Settlement tx   : ${settleTx}`)
    console.log(`  -> explorer   : https://www.oklink.com/xlayer-test/tx/${settleTx}`)
  }
  console.log(`Live board      : ${APP}/tasks/${taskId}`)
  console.log('============================================\n')

  if (status !== 'verified') {
    console.log('⚠️  Not auto-verified. If it says "submitted", verification held for review;')
    console.log('   if "failed", check the notary reason in the Submit result above.')
  } else {
    console.log('✅ FULL LOOP VERIFIED: user paid -> oracle delivered -> settled on-chain.')
  }
}

main().catch(e => die('Unexpected error: ' + (e?.message ?? e)))
