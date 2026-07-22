# GroundTruth — Demo Script & Pitch

## Tagline
> **The missing workforce layer for AI agents.**

(Alt: *"AI agents can think, browse, and pay — but they can't walk outside. GroundTruth is how they hire someone who can."*)

---

## The 10-second frame (open with a story, not architecture)
> "Your AI travel agent is booking a trip and realizes your passport photo is expired. It can't take the photo for you. So it **posts a task, a nearby human takes the photo, an AI notary verifies it's real and fresh, and the human is paid on-chain — automatically.** That's GroundTruth."

Other one-liners that land in 5 seconds:
- *"Your delivery drone breaks — the agent instantly hires the nearest human, verifies the drop, and releases payment."*
- *"An AI shopping agent needs to know if a store actually has an item in stock — it pays a human standing there to check."*

The point: **AI agents increasingly need the physical world. GroundTruth is the marketplace + trust layer for that.**

---

## The 90-second live demo (run in this order)

**0:00 — The board.** Open `/tasks`. Point at the **Top Oracles leaderboard** (real workers, verified-rate) and the **Settlement Ledger** (real on-chain payments). "This is a live marketplace — agents on one side, humans on the other."

**0:15 — An agent pays.** Trigger a task via the MCP `human_do` tool (real x402-style payment). "The agent just paid into escrow on X Layer, from **its own wallet** — here's the tx." (Ledger shows agent `0x8046…` → contract.)

**0:30 — THE FRAUD ATTEMPT (the hook).** Claim the task. Note the **freshness code** shown on screen. Now submit the WRONG proof — a photo that does *not* contain the code (a stock/old image). Watch the **rejected screen with the explainable checklist**:
```
✓ Subject matches the task
✗ Freshness code 7A91C visible in photo
→ Payment rejected.
```
Say: **"Auto-accept was ON — the notary overrode it. Even a correct-looking photo earns nothing without proof it was taken *now, for this task*. This is what stops 'just upload any Google image.'"** ← the money moment.

**0:50 — The honest proof.** Re-do it with the code written in-frame. Done screen:
```
✓ Subject matches the task
✓ Freshness code 7A91C visible in photo
✓ Confidence 94%
→ Payment released.
```

**1:05 — Settlement.** Screen flips to "Mission complete," payout + fee shown, the worker's leaderboard entry ticks up.

**1:20 — Land on the explorer.** Click the **real on-chain payout tx** on the X Layer explorer — a distinct **worker** address receiving mUSDT. "Agent paid, human verified, settled on-chain — three distinct wallets, end to end."

---

## Answers to the questions judges WILL ask

- **"Couldn't I just upload a random Google image?"**
  → *"No — every task issues a random freshness code the worker must include in the proof. A stock or old image can't contain a code that didn't exist when it was captured, and the AI notary rejects it. Watch —"* (do the reject beat).

- **"Is this real x402?"**
  → *"The payment is a real on-chain mUSDT transfer on X Layer with an x402 payment header — an x402-**style** rail. A fully spec-faithful facilitator verify/settle round-trip is the next step; the money movement and escrow are already real and on the explorer."* (Own it — don't let them catch it.)

- **"What stops Sybil / one person farming with 100 wallets?"**
  → *"Reputation is surfaced today (verified-rate per wallet); economic staking is a mainnet phase-2 concern, deliberately out of scope for a testnet build. The trust primitive that matters for the demo — proof authenticity — is solved by the freshness gate."*

- **"Does the AI actually decide, or is it cosmetic?"**
  → *"It's the gate. A confident mismatch or a missing freshness code sets the task to failed with zero on-chain payout — you just saw it say no."*

- **"What if your vision API is down or rate-limited mid-demo?"**
  → *"Verification degrades safely — no incorrect payment is ever made. We rotate across multiple keys, fall back to a second provider (OpenRouter), and if every provider is unavailable the task is **held for review**, not auto-approved. A rate-limited API can slow us down; it can never let a bad proof through."* (This is now a strength — the system fails **closed**.)

---

## Pre-demo checklist (don't get burned live)
- [ ] **Vision resilience is wired** (2 Gemini keys rotate on 429 → OpenRouter fallback → fail-closed hold). Still smart to pre-warm and not spam it, but a single rate-limit no longer breaks the demo or lets a bad proof through.
- [ ] Agent wallet (`AGENT_PRIVATE_KEY`) funded with mUSDT (faucet).
- [ ] `AUTO_ACCEPT` on (so the notary override is the visible story).
- [ ] Have the code-bearing and no-code photos ready, or write the code on paper on camera (more convincing).
- [ ] Run once end-to-end before going live (first request compiles/warms).

---

## Why this wins its category
- **Creative Genius:** "AI hires humans" is a genuinely novel inversion; the freshness-code + explainable notary is a memorable, visible innovation.
- **Best Product:** complete working loop — MCP → payment → human → AI verification → on-chain settlement → reputation — with an honest, transparent trust model.
