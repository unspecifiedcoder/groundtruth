# GroundTruth — System Overview (for developers & review)

> **One line:** AI agents hire human oracles to do real-world tasks; a human submits proof; an AI notary verifies the proof actually matches the request; the worker is paid on-chain — all via an MCP server, x402-style payment, and settlement on X Layer.

This doc explains what the system does, how a request flows end-to-end, what was built/changed most recently, and the known gaps worth a reviewer's attention.

---

## 1. The core loop

```
AI Agent ──(MCP: human_do)──▶ x402 payment ──▶ Task on the Oracle Board
                                                      │
                                              Human claims + does it
                                                      │
                                              Submits proof (photo/form)
                                                      │
                        Integrity gate ──▶ AI Notary (semantic) ──▶ accept / reject
                                                      │ accept
                                              On-chain payout to worker
                                                      │
AI Agent ◀──(MCP: task_status / review_task)── Verified result + settlement tx
```

Three distinct on-chain roles:
- **Agent wallet** (`AGENT_PRIVATE_KEY`) — the buyer; pays for the task.
- **Payroll contract** (`GroundTruthPayroll.sol`) — escrow / settlement.
- **Worker wallet** — the human oracle; receives payout.

---

## 2. Components

| Area | File(s) | What it does |
|---|---|---|
| **MCP server** | `app/api/[transport]/route.ts` | Tools agents call: `ground_truth_info`, `human_do`, `task_status`, `review_task`. |
| **Task creation + x402** | `app/api/v1/human-do/route.ts` | Accepts a task with an `X-PAYMENT` header (or admin demo key); creates the task after payment is verified. |
| **Agent payment** | `lib/agent-pay.ts` | The buyer agent pays: checks mUSDT balance, drips from faucet if low, transfers mUSDT on X Layer, builds the x402 header. Uses `AGENT_PRIVATE_KEY` (distinct from settlement). |
| **Payment verification** | `lib/payment.ts`, `lib/onchain-verify.ts` | Verifies payment fail-closed: facilitator first, else reads the tx receipt on-chain and re-derives the ERC-20 Transfer log (token, recipient, amount, sender). Binds tx hash → one payment (replay defense). |
| **Proof integrity** | `lib/verify.ts` | First gate: correct type, image decodes, required form fields present, dedup (sha256). Blatant fraud fails instantly. |
| **Semantic notary** | `lib/notary.ts`, `lib/groq-vision.ts` | Second gate: does the proof actually satisfy the task *intent*? Photos → Gemini vision; forms → Groq LLM. Confident mismatch → reject (no payout). |
| **Proof submission** | `app/api/tasks/[id]/submit/route.ts` | Runs integrity → notary → resolves the task to `failed` / `verified` in a single DB write; kicks off settlement in the background. |
| **Settlement** | `lib/settle.ts`, `lib/chain.ts` | Pays the worker on-chain via the payroll contract (`settle()`), idempotent (`isSettled`), records the tx on the task. |
| **Agent review** | `app/api/v1/tasks/[id]/review/route.ts` | Manual/agent accept-reject path (used when `AUTO_ACCEPT=false`). |
| **UI** | `app/tasks/page.tsx`, `app/tasks/[id]/page.tsx` | Mission board + settlement ledger + top-oracles leaderboard; task detail with claim/submit/verify/paid screens. |
| **DB** | `lib/db.ts`, `supabase/migrations/*` | Supabase (Postgres). Tasks state machine (CAS transitions), payments, workers/reputation, proof-hash dedup. |

---

## 3. End-to-end flow (detailed)

1. **Agent posts a task** via MCP `human_do`. `agentPay` (buyer wallet) transfers mUSDT to the payroll contract on X Layer and builds an x402 header; `POST /api/v1/human-do` verifies the payment (facilitator → on-chain fallback, fail-closed) and creates the task (`pending`).
2. **Human claims** the task on `/tasks/[id]` — `claim_task` sets it `claimed` for that wallet.
3. **Human submits proof** (photo or form). The submit route:
   - **Integrity gate** — hard-fails blatant fraud (no image / empty fields / dup).
   - **Notary gate** — an AI judges proof-vs-intent. `reject` (confidence ≥ `NOTARY_REJECT_CONFIDENCE`, default 0.6) → task `failed`, no payout. `accept` / `uncertain` → proceed (fail-toward-worker).
   - Resolves to `verified` (auto-accept) or `submitted` (manual review) in one DB write.
4. **Settlement (background)** — for `verified`, `settleTask` pays the worker on-chain and records the tx; the UI polls and flips to "Mission complete" with the verdict + tx link.
5. **Agent reads result** via `task_status` (sees proof, notary verdict, settlement) or drives `review_task` in manual mode.

**Task states:** `pending → claimed → submitted → (verified | failed)` — all transitions are compare-and-swap (CAS) guarded, so concurrent actors can't corrupt state; settlement is idempotent.

---

## 4. What changed most recently (this work session)

Goal: turn "any uploaded file pays" into real, defensible verification, and make the on-chain economy credible. Adversarial "judge" review moved the project **62 → 84/100**.

1. **Semantic notary (the headline).** Added `lib/notary.ts` as a real accept **gate**: photos judged by Gemini vision, forms by a Groq LLM. A confident mismatch (a wall photo, a gibberish form) is **rejected with no payout**, even with auto-accept on. Tested both modes, both directions.
2. **Two distinct wallets.** `agentPay` now uses `AGENT_PRIVATE_KEY` (separately funded) so the on-chain trail reads **agent → contract → worker** as three different addresses — not one key paying itself.
3. **Faster / cleaner UX.** Async settlement (worker isn't blocked on the ~10s on-chain confirmation); submit collapsed from ~5 DB round-trips to ~2; verify screen always shows motion; done screen shows the notary verdict; rejected screen shows the mismatch reason.
4. **Reputation.** Top-oracles leaderboard (completed / verified-rate / earnings) surfaced on the board.
5. **Robustness fixes.** Fixed a read-cache bug (`/api/v1/tasks/[id]` now `force-dynamic`) that had the UI stuck on stale status; fixed settlement overwriting the notary verdict (now merges); claim no longer collapses a task's expiry (migration 003); address casing normalized before on-chain settle.

---

## 5. Verification model (the differentiator)

Two levels — **presence** then **meaning**:
- **Integrity** = "is this a real, non-duplicate proof of the right shape?"
- **Notary** = "does its *content* actually satisfy what was asked?"

Neither claims to verify *truth of fact* (there's no ground truth for "the coffee is $4.50" — that's what hiring a human is for). It rejects *irrelevant/fraudulent-shape* proof and pays *plausible* proof; the calling agent retains a review/override path. The notary **fails toward the worker**: any API error / low confidence → pays, never denies an honest worker over an infra hiccup.

---

## 6. Config / env

- On-chain: `AGENT_PRIVATE_KEY` (buyer), `SETTLEMENT_PRIVATE_KEY` (operator/payout), `PAYROLL_CONTRACT_ADDRESS`, `SETTLEMENT_RPC/CHAIN_ID`.
- Notary vision: `VISION_API_URL` / `VISION_API_KEY` / `VISION_MODEL` (currently Gemini `gemini-flash-latest`, OpenAI-compatible endpoint). Form judge: `GROQ_API_KEY` (+ `FORM_JUDGE_MODEL`).
- Behavior: `AUTO_ACCEPT` (default on), `NOTARY_REJECT_CONFIDENCE` (default 0.6).
- Data: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 7. Known gaps / for reviewer scrutiny

Ranked by the adversarial review (honest — call these out yourself before a judge does):

1. **x402 handshake is simplified.** The payment is a *real* on-chain mUSDT transfer + a self-built base64 x402 header — not a spec-faithful facilitator verify/settle round-trip (EIP-712 / Permit2 the facilitator validates). Money is real; the *protocol handshake* is simulated. Describe it as "x402-style / x402 rail." This is the clearest path to "front-runner."
2. **Notary verifies topicality, not evidence.** It judges "does this image show X," with no liveness / geolocation / timestamp / anti-reuse — a matching stock photo passes. A server-issued nonce that must appear in-frame (proof produced *after* claim) + perceptual-hash dedup would close this.
3. **"Uncertain → pays" is availability-gameable.** Rate-limiting or timing out the vision key degrades a call to `uncertain` → pays. Free-tier Gemini rate-limits (~20/min); pre-warm before a demo.
4. **No stake / Sybil resistance.** Any address can claim + collect; reputation is *visible* (leaderboard) but not *economically bonded*. Phase-2 story.
5. **Demo-bypass paths** mint `0xdemo…` tx hashes (admin key). The ledger already suppresses explorer links for non-real hashes; drive the real path in a live demo.

---

## 8. Run / test locally

```bash
npm install
# .env.local must have the keys in §6
npm run dev            # http://localhost:3000
```
Create a task via the MCP `human_do` tool (real x402) or `POST /api/v1/human-do` with `X-DEMO-KEY`. Then claim + submit on `/tasks/[id]`. Submit a matching proof → verified + paid; submit a mismatched one → rejected, no payout.

**Note:** local dev on WSL/`/mnt/c` is slow (route compile + DB round-trips over a slow network stack); this is an environment artifact, not the app — it's fast on Vercel.

---

## 9. Pending ops (not yet applied to prod)

- Apply `supabase/migrations/002_payment_replay_guard.sql` and `003_claim_hardening.sql`.
- Install `@vercel/functions` (for `waitUntil` background settlement on Vercel).
- Deploy the `harden-and-polish` branch.
