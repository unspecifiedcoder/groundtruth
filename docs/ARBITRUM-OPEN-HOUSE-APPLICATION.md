# Arbitrum Founder House Singapore — GroundTruth application packet

Last verified: 2026-10-04

## Submission identity

- Founder: Ravi Shankar Bejini
- Team: Solo founder
- Country / city: India / Hyderabad
- GitHub: `unspecifiedcoder`
- LinkedIn: https://www.linkedin.com/in/ravishankarbejini
- Telegram: `ravi_invincible`
- Product: https://groundtruth-oracle.vercel.app
- Repository: https://github.com/unspecifiedcoder/groundtruth
- Arbitrum build page: https://groundtruth-oracle.vercel.app/arbitrum
- Judge console: https://groundtruth-oracle.vercel.app/judge
- Robinhood + USDG proof: https://groundtruth-oracle.vercel.app/robinhood
- Receipt verifier: https://groundtruth-oracle.vercel.app/receipts
- Arbitrum Sepolia registry: `0xaf712732bd2c8ef589bb9fff5421ed428e4207e1`
- Deployment transaction: https://sepolia.arbiscan.io/tx/0xaa1f82b0839f4242c49d14d12ed0c896d5250d89db2e59a57e41f80bb1ed5083
- Verifiable protocol-demo task: `00000000-0000-4000-8000-000000042161`
- Demo receipt transaction: https://sepolia.arbiscan.io/tx/0xfed109f5d010f88205e9f2def4ae7bce6a779953eb4c5a73f52dc4ff6c4fd4d8
- Robinhood Testnet USDG escrow: `0x725cce0916d2e8682438732fd9e79803b4fab2bd`
- Robinhood Testnet receipt registry: `0x430172985b21458d73576435d4ad4beea85f376c`
- USDG settlement transaction: https://explorer.testnet.chain.robinhood.com/tx/0x0f055da7c51d942f14dfcb3b224b3f598d7a6ba8a7dd479f77bb49346f00e772

## One-line pitch

GroundTruth gives onchain agents proof of what is physically true before they pay, settle, or update real-world state.

## Project description

GroundTruth is a physical-state verification layer for software and autonomous agents. Digital APIs can report that inventory, a delivery, a storefront, or an asset should exist; they cannot prove its present condition. A buyer defines an objective proof specification, GroundTruth dispatches a local operator, collects fresh photo or form evidence, reviews it against the checklist, and returns a structured result and auditable receipt.

The first commercial wedge is retail execution—on-shelf availability, displayed price, promotion, and placement—sold as a fixed 10-store launch validation and converted into recurring monitoring. The live MVP exposes HTTP, MCP, and A2A interfaces and accepts x402 payments. For Arbitrum, GroundTruth adds canonical USDC payment on Arbitrum One, a privacy-preserving evidence receipt registry on Arbitrum Sepolia, and a USDG task escrow plus receipt flow on Robinhood Chain Testnet. The registries store only hashes of the evidence manifest, proof specification, and verdict; they never store photos, precise coordinates, or personal data.

At Founder House I would productionize the Arbitrum path: validate the paid flow with external agent wallets, move the registry from Sepolia to Arbitrum One after review, add retry and monitoring around receipt publication, and validate one design-partner workflow in retail, RWA, or DePIN operations.

The long-term opportunity is not a generic gig marketplace. It is reusable infrastructure for agentic commerce and tokenized real-world workflows that need present physical evidence before releasing funds or changing state.

## Project I am most proud of

GroundTruth is the project I am most proud of. I designed and shipped it as a solo founder to solve a boundary that digital systems cannot cross: proving what is physically true at a location now.

The live product converts a structured request into a funded field task, guides an operator through a photo or form checklist, applies freshness and evidence-integrity checks, routes submissions through AI-assisted and manual review, and returns a machine-readable receipt through HTTP, MCP, and A2A interfaces. I also implemented server-priced x402 payment challenges, asynchronous task status, audit events, privacy controls, and operational gates that prevent paid campaigns from being published without verified local coverage.

I deliberately separate test activity from customer traction. GroundTruth has a live MVP and one historical external evaluation commitment, but no verified external revenue, recurring customers, or calibrated active operators yet. That honesty is reflected in the product's revenue and fulfillment controls.

## Recommended application selections

- Role: Founder
- Primary goal: Launch a startup/project
- Team: Solo
- Team name: GroundTruth
- Status: Live / Deployed
- Categories: AI, Infrastructure, RWA, Developer Tooling
- Destination: Multichain, with Arbitrum as the physical-evidence receipt and agent-payment layer
- X profile: leave blank while the existing account is suspended
- Referral code: leave blank unless a genuine code exists
- Web3 experience and time commitment: founder must select the truthful answer

## Why Arbitrum

Arbitrum is useful to GroundTruth for three concrete reasons:

1. Canonical USDC lets autonomous buyers fund small verification jobs without introducing a project token.
2. Low-cost public receipts make evidence digests and verdicts independently auditable without publishing private evidence.
3. The agentic-finance, RWA, and infrastructure ecosystem contains workflows where a physical-state error can block settlement or create material loss.

GroundTruth does not claim that a hash proves a photograph is truthful. The receipt proves that the evidence package and verdict have not changed since publication. Freshness, location, integrity, semantic checks, and human review remain separate controls.

## Current evidence

- Production application with health, API, MCP, A2A, and machine-readable x402 surfaces.
- Canonical Arbitrum One USDC rail configured through a facilitator that advertises x402 v2 exact support for `eip155:42161`.
- A server-priced `integration_test` gives judges a capped `$0.01` USDC payment-and-orchestration path; it is explicitly not sold as physical field fulfillment.
- A public judge console verifies production health, OpenAPI, MCP, A2A, the live HTTP 402 offer, and the Sepolia receipt without requiring an account or payment.
- Network-aware payment finality and explorer resolution for Arbitrum, Base, and X Layer on newly settled tasks.
- Hash-only receipt registry deployed successfully to Arbitrum Sepolia at block `315645259`.
- A clearly labeled protocol-demo receipt was recorded successfully at block `315647455`; it demonstrates contract read/write and is not represented as customer activity.
- Deterministic evidence receipt hashing tests.
- Contract compiler verification with Solidity `0.8.24`.
- Robinhood Chain Testnet escrow and registry deployed against Paxos test USDG; a `1.000000` USDG task was funded, receipted, and settled end to end.
- The public `/robinhood` page and `/api/v1/robinhood-demo` endpoint independently read the deployed contracts and expose the exact transactions.
- No verified revenue, paid pilot, recurring customer, or active calibrated operator is claimed.

## Three-day Founder House milestone

### Day 1 — harden the Arbitrum contract

- Review registry and payment trust boundaries with Arbitrum mentors.
- Add durable receipt-publication retry and monitoring.
- Finalize the Arbitrum One deployment plan and security checklist.

### Day 2 — prove one workflow

- Run one scoped physical-state verification with a reproducible evidence manifest.
- Show both the rejected-evidence path and accepted-evidence path.
- Publish the accepted receipt hash and expose it in task status.

### Day 3 — validate demand

- Demo the uninterrupted agent request → USDC authorization → task → evidence → verdict → Arbitrum receipt flow.
- Secure one scoped evaluation with an agent, commerce operator, RWA team, or DePIN team.
- Leave with a 30/60/90-day commercialization plan tied to measurable pilots, not vanity usage.

## Truth boundary

- Current verified MRR: `$0`
- Current paid pilots: `0`
- Current recurring customers: `0`
- Current calibrated active operators: `0`
- The Sepolia deployment is testnet infrastructure, not mainnet adoption.
- Self-generated transactions, tests, emails, and marketplace listings are not customer traction.
- GroundTruth does not provide cryptographic camera-origin guarantees or zero-knowledge location proofs.
