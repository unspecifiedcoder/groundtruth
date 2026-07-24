# GroundTruth — Reality-as-a-Service

> AI agents hire human oracles to verify the real world. Paid on-chain via x402. Settled on X Layer.

[![Live Demo](https://img.shields.io/badge/Live-groundtruth--oracle.vercel.app-0DCCFF?style=flat-square)](https://groundtruth-oracle.vercel.app)
[![ASP](https://img.shields.io/badge/OKX%20AI%20Marketplace-ASP%20%236282-F5A623?style=flat-square)](https://www.okx.com/web3/build/ai)
[![X Layer](https://img.shields.io/badge/X%20Layer-chainId%20196-A78BFA?style=flat-square)](https://www.okx.com/xlayer)
[![x402](https://img.shields.io/badge/Protocol-x402-00E87A?style=flat-square)](https://x402.org)

---

## What is GroundTruth?

AI agents are powerful — but blind to the physical world. They can read the internet, but can't walk outside, verify if a shop is open, read a price tag, or check inventory on a shelf.

**GroundTruth bridges that gap.**

An AI agent posts a task (photo or form), a human oracle completes it in the real world, an **AI notary verifies the proof actually matches the task**, and the payout settles on-chain — all in minutes. Payment is verified on-chain (fail-closed); proof is verified by a semantic AI gate that rejects mismatches.

```
AI Agent  →  [MCP: human_do]  →  x402 Payment  →  Oracle Board
                                                          ↓
AI Agent  ←  [MCP: task_status]  ←  Verified Proof  ←  Human Oracle
```

---

## Demo

**Live app:** https://groundtruth-oracle.vercel.app

**Video demo:** https://x.com/0xBejini/status/2078065892659958215

### Try it yourself

Add the MCP server to Claude Code:
```bash
claude mcp add groundtruth --transport http https://groundtruth-oracle.vercel.app/api/mcp
```

Then in a Claude session:
```
Call human_do with:
- intent: "Verify the nearest coffee shop is open and photograph the entrance"
- proof_type: photo
- instructions: "Clear photo of the entrance showing it is open"
- budget_usdt: "2.00"
```

Claude will autonomously check its wallet, drip from the faucet if needed, transfer mUSDT on X Layer testnet, and create the task — no human approval required.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     AI Agent (MCP)                      │
│  ground_truth_info → human_do → task_status             │
└────────────────────────┬────────────────────────────────┘
                         │ x402 X-PAYMENT header
                         ▼
┌─────────────────────────────────────────────────────────┐
│              GroundTruth API (Next.js)                  │
│  /api/mcp          MCP server (SSE transport)           │
│  /api/v1/human-do  Task creation + payment verify       │
│  /api/v1/tasks/:id Task status + proof                  │
│  /api/faucet       mUSDT testnet faucet                 │
└────────┬───────────────────────┬────────────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐   ┌──────────────────────────────────┐
│   Supabase DB   │   │        X Layer Blockchain        │
│  tasks          │   │  GroundTruthPayroll.sol           │
│  payments       │   │  MockUSDT (testnet)               │
│  workers        │   │  chainId: 196 (mainnet)           │
│  proof_hashes   │   │  chainId: 1952 (testnet)          │
└─────────────────┘   └──────────────────────────────────┘
```

### Key flows

**1. Autonomous x402 Payment (agent-initiated)**
1. Agent calls `human_do` via MCP
2. `lib/agent-pay.ts` checks mUSDT balance on X Layer testnet
3. If balance < $2 → auto-drips from faucet (real on-chain tx)
4. Transfers 2 mUSDT to GroundTruthPayroll contract (real on-chain tx)
5. Encodes tx hash in x402 payment header
6. POSTs to `/api/v1/human-do` with `X-PAYMENT` header
7. Task created, oracle board updated

**2. Human Oracle Flow**
1. Oracle visits `/tasks` — sees mission board
2. Accepts a task → wallet address recorded
3. Completes the mission in the real world
4. Uploads photo or fills form
5. Proof hashed and stored on-chain
6. Oracle earns 1.76 USDT (after 12% platform fee)

**3. Payment Verification (fail-closed)**
- Primary: OKX x402 facilitator (`https://www.okx.com/web3/build/ai/verify`)
- Fallback: **on-chain verification** (`lib/onchain-verify.ts`) — reads the tx receipt, re-derives the ERC-20 Transfer log, and confirms token, recipient, amount, and sender. Never trusts the header; a forged/replayed payment is rejected (tx hash bound to one payment).

**4. Proof Verification — the semantic notary (`lib/notary.ts`)**

Proof is checked on two levels, not just "a file was uploaded":

1. **Integrity gate** — correct type, image decodes, required form fields present, not a duplicate. Blatant fraud fails instantly.
2. **Semantic notary** — an AI judges whether the proof actually satisfies the task *intent*:
   - **Photos** → a vision model (Gemini) — "does this image show the task being done?"
   - **Forms** → an LLM (Groq) — "does this answer plausibly satisfy the task?"

   A **confident mismatch is rejected with no payout** (a photo of a wall, a gibberish form). When the model is *unsure*, it errs toward paying the worker — GroundTruth never denies an honest oracle over an AI hiccup. The verdict (decision · confidence · reason) is stored on the task and shown to both the oracle and the calling agent.

This makes "proof" mean *verified content*, not *a decodable JPEG*.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS |
| MCP Server | `mcp-handler`, SSE transport |
| Blockchain | viem v2, X Layer (chainId 196/1952) |
| Smart Contract | Solidity, Foundry, GroundTruthPayroll.sol |
| Database | Supabase (PostgreSQL + RLS) |
| Payments | x402 protocol, MockUSDT (testnet) |
| AI Marketplace | OKX AI (ASP #6282, A2MCP service) |
| Deployment | Vercel |

---

## MCP Tools

### `ground_truth_info`
Returns service info, pricing, and endpoint details.

### `human_do`
```typescript
{
  intent: string          // What you want verified
  proof_type: "photo" | "form"
  instructions: string   // Instructions for the human oracle
  budget_usdt?: string   // Default: "2.00"
  timeout_seconds?: number // Default: 3600
}
```
Returns `task_id`, `board_url`, `poll_url`, and full payment audit trail including `faucet_tx` and `payment_tx`.

### `task_status`
```typescript
{
  task_id: string  // UUID from human_do
}
```
Returns `status` (pending → claimed → submitted → verified), `result`, `proof_available`.

---

## Smart Contract

**GroundTruthPayroll.sol** — deployed on X Layer testnet
```
Address: 0x430172985b21458d73576435D4aD4bEeA85F376C
Network: X Layer testnet (chainId 1952)
```

Handles worker payouts, proof hash recording, and settlement finality.

---

## Local Development

### Prerequisites
- Node.js 18+
- pnpm
- Supabase account
- X Layer testnet wallet with OKB for gas

### Setup

```bash
git clone https://github.com/unspecifiedcoder/groundtruth
cd groundtruth
pnpm install
```

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# X Layer wallet (testnet)
SETTLEMENT_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_SECRET=your-secret-key

# OKX
OKX_PAYMENT_TOKEN=0x74b7F16337b8972027F6196A17a631aC6dE26d22
OKX_PAYMENT_NETWORK=196
ASP_PRICE_USDT=2.00
ASP_FEE_BPS=1200
```

Run database migrations:
```bash
pnpm supabase db push
```

Start dev server:
```bash
pnpm dev
```

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/mcp` | GET/POST | MCP server (SSE transport) |
| `/api/v1/human-do` | POST | Create task (x402 payment required) |
| `/api/v1/tasks/:id` | GET | Get task status + proof |
| `/api/faucet` | POST | Drip 10 mUSDT to address (testnet) |
| `/api/faucet` | GET | Check mUSDT balance |
| `/api/pulse` | GET | Network stats |

### x402 Payment Header Format
```json
{
  "from": "0x...",
  "txHash": "0x...",
  "paymentReference": "unique-ref",
  "network": "xlayer-testnet",
  "token": "0x725cCe0916d2E8682438732fD9e79803B4fAB2BD",
  "amount": "2000000"
}
```
Base64-encode and send as `X-PAYMENT` header.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── [transport]/    # MCP server
│   │   ├── v1/human-do/    # Task creation + payment
│   │   ├── v1/tasks/[id]/  # Task status
│   │   └── faucet/         # mUSDT faucet
│   ├── tasks/              # Oracle mission board
│   ├── pulse/              # Network stats
│   └── faucet/             # Faucet UI
├── lib/
│   ├── agent-pay.ts        # Autonomous x402 payment
│   ├── payment.ts          # x402 verify + challenge
│   ├── chain.ts            # viem X Layer client
│   ├── db.ts               # Supabase queries
│   └── planner.ts          # Task planning
├── contracts/
│   └── src/
│       └── GroundTruthPayroll.sol
└── supabase/
    └── migrations/
```

---

## On-Chain Proof

Every payment GroundTruth processes is verifiable on OKX's X Layer explorer:

Example transaction:
```
https://www.okx.com/web3/explorer/xlayer-test/tx/0x5c5d7d7f4a19c359b2445652dc9b7cf88fbe2a1c7c07273614db0902d3363d6a
```

---

## Built For

**OKX AI Agent Hackathon 2026**
- ASP #6282 on OKX AI Marketplace
- Category: A2MCP (API service)
- Network: X Layer

---

## License

MIT
