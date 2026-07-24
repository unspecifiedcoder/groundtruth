# HackQuest Submission — copy/paste content

## Basics

**Name**
```
GroundTruth
```

**Intro** (185 / 200)
```
AI agents can't see the real world. GroundTruth lets them hire human oracles for photo and form tasks — an AI notary verifies the proof, and payment settles on-chain via x402 on X Layer.
```

**Sector** (pick 3 of 4 slots)
- AI
- RWA
- Infra

**Tech Tag** (5 of 8 — leave the rest empty rather than pad)
- Next
- React
- Node
- Solidity
- Web3

**MVP Link**
```
https://groundtruth-oracle.vercel.app
```

**Project Link**
```
https://github.com/unspecifiedcoder/groundtruth
```

**X (Twitter) Link**
```
0xBejini
```

**Wallet** — connect a wallet on **X Layer**. Use your own wallet, NOT the app's
settlement or agent keys.

---

## Deployment Details (judges only)

**Ecosystem Deployed:** X Layer
**Network:** Testnet

**Contract address**
```
0x430172985b21458d73576435D4aD4bEeA85F376C
```

**Deployed link**
```
https://www.oklink.com/xlayer-test/address/0x430172985b21458d73576435D4aD4bEeA85F376C
```

Supporting on-chain detail (paste under the address if there's room):
- Contract: `GroundTruthPayroll.sol` — worker payouts, proof-hash recording, settlement finality
- Chain ID: **1952** (X Layer testnet) · RPC `https://testrpc.xlayer.tech`
- Payment token (mUSDT): `0x74b7F16337b8972027F6196A17a631aC6dE26d22`
- Permit2 (x402 exact scheme): `0x000000000022D473030F116dDEE9F6B43aC78BA3`
- OKX AI Marketplace ASP: **#6282** (GroundTruth)

---

## Description

GroundTruth is Reality-as-a-Service: the missing workforce layer for AI agents.

AI agents are powerful but blind to the physical world. They can read the entire
internet, yet they cannot walk outside, check whether a shop is actually open,
read a price tag on a shelf, confirm a delivery arrived, or photograph a physical
defect. Every agent framework hits the same wall — the last mile is physical.

GroundTruth closes that gap with a marketplace where AI agents hire human oracles.

An agent calls a single MCP tool, `human_do`, describing what it needs verified in
the real world. GroundTruth returns an HTTP 402 with an x402 payment challenge.
The agent signs an EIP-712 authorization, GroundTruth acts as the x402 facilitator
— verifying the signature and settling it on-chain — and the task goes live on a
public oracle board. A human nearby claims it, completes it, and submits proof.

The critical piece is what happens next. Proof is not taken on trust. An AI notary
checks that the submitted proof semantically matches the task intent: for photos,
a vision model confirms the requested subject is actually present; for forms, a
language model checks the answers are responsive. Every task also carries a
freshness challenge — a random code the worker must include in-frame or in a field
— which defeats stock imagery and replayed submissions. A confident mismatch is
rejected and no money moves. If verification is unavailable, the system fails
closed: the proof is held for review rather than silently auto-paid.

When the proof passes, settlement happens synchronously on X Layer before the API
responds, so "verified but never paid" is structurally impossible. The agent polls
`task_status` and receives the verified result plus an on-chain transaction hash.

Everything is verifiable end to end: payment is a real signed authorization
settled on-chain, the verdict is explainable as a per-check pass/fail list shown
in the UI, and the payout is a transaction anyone can look up on OKLink.

---

## Progress During Hackathon

Everything below was built during the hackathon — the project started from zero.

**Protocol and payments**
- Implemented the x402 "exact" scheme properly rather than mocking it. On-chain
  investigation showed the payment token has no EIP-3009 support, but Permit2 is
  deployed on X Layer, so the Permit2 variant was implemented: the agent signs an
  EIP-712 PermitTransferFrom, and the facilitator verifies signer, token, amount,
  recipient, spender and deadline before settling via `permitTransferFrom`. The
  facilitator cannot alter the amount or the recipient.
- Added replay protection by checking the Permit2 nonce bitmap on-chain before
  settling, so a reused authorization is rejected rather than re-executed.
- Separated the agent wallet from the settlement wallet so the money trail is three
  distinct addresses — the server never pays itself.

**Verification**
- Built the AI notary: vision-model checking for photo proofs, language-model
  checking for form proofs, judged against the task intent.
- Added the per-task freshness challenge that kills stock and replayed proofs. The
  form-side check is deterministic and runs before the model, so it cannot be
  talked around.
- Made the verdict explainable — the UI renders each check as a pass/fail line, so
  a rejected worker sees exactly why.
- Made verification fail closed, with provider key rotation and a fallback provider
  chain so a rate-limited vision API degrades safely instead of auto-approving.

**Contracts and reliability**
- Wrote and deployed `GroundTruthPayroll.sol` to X Layer testnet with settlement
  finality and proof-hash recording.
- Made settlement synchronous so the payout is guaranteed before the API responds.
- Hardened the claim path so an abandoned claim frees the task again instead of
  locking it forever.

**Product**
- Shipped the oracle board PWA: claim, submit photo or form proof, drag-and-drop
  upload, retry after a failed attempt, live settlement ledger, and an oracle
  reputation leaderboard.
- Shipped the MCP server so any MCP-compatible agent can hire humans with one tool
  call.
- Registered GroundTruth as ASP #6282 on the OKX AI Agent Marketplace.

The build was run as an adversarial loop: an independent judge agent scored the
project and named the single biggest weakness, that weakness was fixed, and the
cycle repeated. The score moved from 62 to 95 across six rounds, and the verification
layer — the weakest point at the start — became the strongest.

---

## Fundraising Status

Not fundraising. GroundTruth is self-funded and was built solo during the
hackathon. No outside capital has been raised and no token exists. Current focus is
proving the model works end to end on X Layer; any future raise would come after
real task volume, not before.

---

## Images (need 4 @ 1280x720)

Suggested screenshots — capture from https://groundtruth-oracle.vercel.app:
1. Oracle board with open missions
2. Task detail with the freshness code visible
3. Verdict screen with the pass/fail notary checklist
4. Settlement ledger showing on-chain payouts with tx hashes

## Videos

- Demo video: `demo/groundtruth-full-flow.webm` (convert to mp4 / upload to YouTube)
- Freshness reject beat: `demo/groundtruth-freshness-demo.webm`
- Already posted: https://x.com/0xBejini/status/2078065892659958215
