import {
  createWalletClient, createPublicClient, http, parseAbi,
  recoverTypedDataAddress, getAddress, type Hex, type Address,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// ── Spec-faithful x402 "exact" settlement via Permit2 ────────────────────────
//
// The agent SIGNS a Permit2 SignatureTransfer authorization (EIP-712). It never
// sends the tokens. The facilitator (our server) VERIFIES the signature and
// SETTLES on-chain by calling Permit2.permitTransferFrom, which pulls the tokens
// from the agent to payTo. The facilitator cannot change the token or amount —
// they are inside the signature. This is the x402 exact scheme, permit2 variant.
//
// Permit2 is deployed at the canonical address on X Layer (verified on-chain).

export const PERMIT2_ADDRESS: Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

const CHAIN_ID = Number(process.env.SETTLEMENT_CHAIN_ID ?? '1952')
const RPC = process.env.SETTLEMENT_RPC ?? 'https://testrpc.xlayer.tech'

const chain = {
  id: CHAIN_ID,
  name: CHAIN_ID === 196 ? 'X Layer' : 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: { default: { http: [RPC] }, public: { http: [RPC] } },
} as const

// EIP-712 domain for Permit2 (note: no `version` field).
const domain = { name: 'Permit2', chainId: CHAIN_ID, verifyingContract: PERMIT2_ADDRESS } as const

// PermitTransferFrom typed-data. `spender` is the facilitator that will call
// permitTransferFrom (bound into the signature so only it can redeem).
const types = {
  PermitTransferFrom: [
    { name: 'permitted', type: 'TokenPermissions' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
  TokenPermissions: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
} as const

export interface X402Authorization {
  from: Address
  token: Address
  amount: string      // token base units (stringified uint256)
  spender: Address    // facilitator / settler wallet
  nonce: string       // Permit2 unordered nonce (stringified uint256)
  deadline: string    // unix seconds (stringified)
  payTo: Address      // recipient the facilitator will transfer to
}

export interface X402Payment {
  x402Version: number
  scheme: 'exact'
  network: string     // eip155:<chainId>
  payload: { signature: Hex; authorization: X402Authorization }
}

function typedMessage(auth: X402Authorization) {
  return {
    permitted: { token: auth.token, amount: BigInt(auth.amount) },
    spender: auth.spender,
    nonce: BigInt(auth.nonce),
    deadline: BigInt(auth.deadline),
  }
}

// ── Client side: sign the authorization and build the X-PAYMENT header ────────
export async function signX402Payment(
  agentPrivateKey: Hex,
  params: { token: Address; amount: string; payTo: Address; spender: Address; ttlSeconds?: number }
): Promise<{ header: string; payment: X402Payment }> {
  const account = privateKeyToAccount(agentPrivateKey)
  const client = createWalletClient({ account, chain, transport: http(RPC) })

  // Random 256-bit unordered nonce (Permit2 tracks a used-nonce bitmap).
  const nonce = BigInt('0x' + [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join(''))
  const deadline = BigInt(Math.floor(Date.now() / 1000) + (params.ttlSeconds ?? 600))

  const auth: X402Authorization = {
    from: account.address,
    token: getAddress(params.token),
    amount: params.amount,
    spender: getAddress(params.spender),
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    payTo: getAddress(params.payTo),
  }

  const signature = await client.signTypedData({
    account, domain, types, primaryType: 'PermitTransferFrom', message: typedMessage(auth),
  })

  const payment: X402Payment = {
    x402Version: 2, scheme: 'exact', network: `eip155:${CHAIN_ID}`,
    payload: { signature, authorization: auth },
  }
  return { header: Buffer.from(JSON.stringify(payment)).toString('base64'), payment }
}

// ── Facilitator side: verify the signed authorization (no chain writes) ───────
export interface VerifyResult { ok: boolean; reason?: string; from?: Address; amount?: bigint }

export async function verifyX402Payment(
  header: string,
  expect: { token: Address; minAmount: bigint; payTo: Address; spender: Address }
): Promise<VerifyResult> {
  let payment: X402Payment
  try {
    payment = JSON.parse(Buffer.from(header, 'base64').toString('utf8'))
  } catch { return { ok: false, reason: 'malformed X-PAYMENT header' } }

  if (payment.scheme !== 'exact') return { ok: false, reason: `unsupported scheme ${payment.scheme}` }
  const a = payment.payload?.authorization
  const sig = payment.payload?.signature
  if (!a || !sig) return { ok: false, reason: 'missing authorization/signature' }

  // Recover the signer from the EIP-712 signature and confirm it is `from`.
  let signer: Address
  try {
    signer = await recoverTypedDataAddress({ domain, types, primaryType: 'PermitTransferFrom', message: typedMessage(a), signature: sig })
  } catch { return { ok: false, reason: 'signature recovery failed' } }
  if (getAddress(signer) !== getAddress(a.from)) return { ok: false, reason: 'signature does not match `from`' }

  // Business checks — the facilitator cannot be tricked into a smaller/redirected pull.
  if (getAddress(a.token) !== getAddress(expect.token)) return { ok: false, reason: 'wrong token' }
  if (getAddress(a.payTo) !== getAddress(expect.payTo)) return { ok: false, reason: 'wrong payTo' }
  if (getAddress(a.spender) !== getAddress(expect.spender)) return { ok: false, reason: 'wrong spender' }
  if (BigInt(a.amount) < expect.minAmount) return { ok: false, reason: 'amount below required' }
  if (BigInt(a.deadline) < BigInt(Math.floor(Date.now() / 1000))) return { ok: false, reason: 'authorization expired' }

  // Replay guard: reject an authorization whose Permit2 nonce is already spent,
  // BEFORE wasting gas on a settle that would revert on-chain. Permit2 stores
  // used unordered nonces as bits in nonceBitmap(owner, wordPos).
  try {
    const pub = createPublicClient({ chain, transport: http(RPC) })
    const nonce = BigInt(a.nonce)
    const word = await pub.readContract({
      address: PERMIT2_ADDRESS,
      abi: parseAbi(['function nonceBitmap(address,uint256) view returns (uint256)']),
      functionName: 'nonceBitmap',
      args: [getAddress(a.from), nonce >> 8n],
    }) as bigint
    if ((word & (1n << (nonce & 0xffn))) !== 0n) return { ok: false, reason: 'authorization already used (nonce spent)' }
  } catch { /* bitmap read failed — on-chain settle still fails closed on reuse */ }

  return { ok: true, from: getAddress(a.from), amount: BigInt(a.amount) }
}

// ── Facilitator side: settle on-chain via Permit2.permitTransferFrom ──────────
const PERMIT2_ABI = parseAbi([
  'function permitTransferFrom(((address token,uint256 amount) permitted,uint256 nonce,uint256 deadline) permit,(address to,uint256 requestedAmount) transferDetails,address owner,bytes signature) external',
])

export async function settleX402Payment(header: string, operatorKey: Hex): Promise<Hex> {
  const payment: X402Payment = JSON.parse(Buffer.from(header, 'base64').toString('utf8'))
  const a = payment.payload.authorization
  const account = privateKeyToAccount(operatorKey)
  const wallet = createWalletClient({ account, chain, transport: http(RPC) })
  const pub = createPublicClient({ chain, transport: http(RPC) })

  const hash = await wallet.writeContract({
    address: PERMIT2_ADDRESS,
    abi: PERMIT2_ABI,
    functionName: 'permitTransferFrom',
    args: [
      { permitted: { token: a.token, amount: BigInt(a.amount) }, nonce: BigInt(a.nonce), deadline: BigInt(a.deadline) },
      { to: a.payTo, requestedAmount: BigInt(a.amount) },
      a.from,
      payment.payload.signature,
    ],
    account,
  })
  await pub.waitForTransactionReceipt({ hash, timeout: 60_000 })
  return hash
}
