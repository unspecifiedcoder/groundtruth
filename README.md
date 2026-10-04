# GroundTruth — Verified Field Evidence

> Dispatch a field check and receive fresh photographic evidence, structured observations, and an auditable verification receipt.

[![Live Demo](https://img.shields.io/badge/Live-groundtruth--oracle.vercel.app-0DCCFF?style=flat-square)](https://groundtruth-oracle.vercel.app)
[![ASP](https://img.shields.io/badge/OKX%20AI%20Marketplace-ASP%20%236282-F5A623?style=flat-square)](https://www.okx.com/web3/build/ai)
[![X Layer](https://img.shields.io/badge/X%20Layer-chainId%20196-A78BFA?style=flat-square)](https://www.okx.com/xlayer)
[![Arbitrum](https://img.shields.io/badge/Arbitrum-One%20%2B%20Sepolia-28A0F0?style=flat-square)](https://groundtruth-oracle.vercel.app/arbitrum)
[![x402](https://img.shields.io/badge/Protocol-x402-00E87A?style=flat-square)](https://x402.org)

---

## What is GroundTruth?

GroundTruth is a field-evidence API. Its first commercial workflow is retail verification: current shelf availability, prices, promotions, and display compliance that cannot be answered reliably from an existing database.

An operations team or AI agent creates a funded task, a field operator completes it, and GroundTruth returns structured results with an evidence trail. The existing prototype supports MCP and A2A, photo and form proof, AI-assisted verification, freshness challenges, and x402 payment in USDC on Arbitrum One and Base or USD₮0 on X Layer. Privacy-preserving evidence receipt hashes can be anchored to the deployed Arbitrum Sepolia registry.

The product is currently in focused-pilot mode. Coverage and turnaround are confirmed before a field campaign begins; the project does not claim universal geographic coverage.

## Public-beta readiness

The application includes crawler and agent discovery (`robots.txt`, `sitemap.xml`, JSON-LD, `llms.txt`, OpenAPI, MCP, A2A, `/.well-known/agent.json`, and `/.well-known/agent-card.json`), private campaign sessions, redacted public task views, signed worker claims, upload validation, persistent rate limiting, audit events, legal/safety pages, hardened browser headers, and `/api/health` readiness reporting.

Before enabling real public traffic:

1. Apply every SQL file in `supabase/migrations` in order, including `004_campaigns.sql` and `005_production_hardening.sql`.
2. Configure the environment documented in `.env.example` with separate high-entropy admin, pilot, and claim-signing secrets.
3. Keep testnet faucet and public receipts disabled; keep auto-accept disabled until the review operation is staffed.
4. Configure production monitoring to alert on a non-200 response from `/api/health`, and verify database backups and evidence retention.
5. Replace the demo settlement signer with an approved production custody model and complete jurisdiction-specific customer/worker agreements.

`/api/health` intentionally returns HTTP 503 until required configuration and migrations are present. A successful website build is not treated as proof of operational readiness.

```
AI Agent  →  [MCP: human_do]  →  x402 Payment  →  Oracle Board
                                                          ↓
AI Agent  ←  [MCP: task_status]  ←  Verified Proof  ←  Human Oracle
```

---

## Demo

**Live app:** https://groundtruth-oracle.vercel.app

**Interactive retail campaign:** `/campaigns/demo` (local or deployed)

**Campaign builder:** `/campaigns/new` (requires the configured pilot access key)

**Video demo:** https://x.com/0xBejini/status/2078065892659958215

> The public activity page includes development, demo, and testnet usage. It is not presented as customer traction.

The complete demo sequence and production prerequisites are documented in [`docs/RETAIL-DEMO.md`](docs/RETAIL-DEMO.md).

### Try it yourself

Add the MCP server to Claude Code:
```bash
claude mcp add groundtruth --transport http https://groundtruth-oracle.vercel.app/api/mcp
```

Then in a Claude session, inspect the service before requesting a paid task:
```
Call ground_truth_info, then prepare a human_do request with:
- intent: "Verify the nearest coffee shop is open and photograph the entrance"
- service_tier: "quick_check"
- proof_spec.type: "photo"
- proof_spec.instructions: "Clear photo of the entrance showing it is open"
```

The unpaid call returns a machine-readable HTTP 402 challenge. A compatible wallet may select one advertised rail, authorize the exact amount and recipient, and replay the request. Coverage and fulfillment remain asynchronous.

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
│   Supabase DB   │   │      Onchain payment rails       │
│  tasks          │   │  GroundTruthPayroll.sol           │
│  payments       │   │  Arbitrum One USDC (42161)        │
│  workers        │   │  Base USDC (8453)                 │
│  proof_hashes   │   │  X Layer USD₮0 (196)            │
└─────────────────┘   └──────────────────────────────────┘

Evidence receipt hashes are recorded separately in `EvidenceReceiptRegistry`
on Arbitrum Sepolia (`0xaf712732bd2c8ef589bb9fff5421ed428e4207e1`).
```

### Key flows

**1. Autonomous x402 Payment (agent-initiated)**
1. Agent calls `human_do` via HTTP or MCP.
2. GroundTruth returns an x402 v2 challenge with only currently facilitator-supported rails.
3. The agent signs the exact network, asset, amount, recipient, and validity window.
4. The facilitator verifies and settles the authorization onchain.
5. GroundTruth records the authoritative payer, amount, network-bound payment reference, and transaction hash.
6. Public USDC rails fail closed when settlement fails.
7. The agent receives a task ID immediately and polls for physical fulfillment.

**2. Human Oracle Flow**
1. Oracle visits `/tasks` — sees mission board
2. Accepts a task → wallet address recorded
3. Completes the mission in the real world
4. Uploads photo or fills form
5. Evidence is screened and its receipt hashes may be anchored on Arbitrum Sepolia
6. The configured payout path settles the worker reward; production campaigns remain coverage- and funding-gated

**3. Payment Verification (fail-closed)**
- X Layer uses the official OKX Payment SDK and facilitator.
- Base and Arbitrum use public x402 v2 facilitators that advertise the exact network and scheme at startup.
- A failed Base or Arbitrum settlement deletes the provisional task instead of exposing unpaid work.
- New payment records bind the task to its settlement network so status checks use the correct RPC and explorer.

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
| Frontend | Next.js 15, React, Tailwind CSS |
| MCP Server | `mcp-handler`, Streamable HTTP transport |
| Blockchain | viem v2, Arbitrum One/Sepolia, Base, X Layer |
| Smart Contract | Solidity, GroundTruthPayroll.sol, EvidenceReceiptRegistry.sol |
| Database | Supabase (PostgreSQL + RLS) |
| Payments | x402 v2, canonical USDC, USD₮0 |
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

Handles the legacy X Layer worker-payout path. It is not described as buyer escrow.

**EvidenceReceiptRegistry.sol** — deployed on Arbitrum Sepolia
```
Address: 0xaf712732bd2c8ef589bb9fff5421ed428e4207e1
Network: Arbitrum Sepolia (chainId 421614)
Deployment: 0xaa1f82b0839f4242c49d14d12ed0c896d5250d89db2e59a57e41f80bb1ed5083
```

Stores only the immutable hashes of the task key, evidence manifest, proof specification, and verdict plus capture/record timestamps. Raw photos, precise coordinates, and personal data remain offchain.

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
