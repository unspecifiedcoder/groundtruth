# GroundTruth — Session State (save point: 2026-07-23)

**Judge score: 95/100 — outright front-runner.** (arc: 62 → 74 → 84 → 89 → 91 → 95)
Odds given: Top-10 ~88%, category prize ~65%, grand prize ~35–40%.

## Where the work lives
- Branch: **`harden-and-polish`** (NOT master). ~24 commits, all authored **Ravi Shankar Bejini**, **no AI attribution** (hard rule).
- Remote: `github.com/unspecifiedcoder/groundtruth`, main branch = **`master`**.
- Vercel project: `okx_submission` (`prj_lq9a68wM65cDdgVq7dZJSc8UE1XV`, team `team_fuF1ncl00YexNiv0zr3wRJgm`).
- **Prod domain: `https://groundtruth-oracle.vercel.app`**.

## ✅ DONE (all tested)
1. **Real x402 "exact" scheme (Permit2 variant)** — `lib/x402.ts`. Agent SIGNS an EIP-712 Permit2 authorization; facilitator VERIFIES (recovers signer, checks token/amount/payTo/spender/deadline + Permit2 nonce replay) and SETTLES via `Permit2.permitTransferFrom`. Facilitator cannot alter amount/recipient. **Proven on-chain** (settle tx `0x467e1a03…`, standalone `0xc3e248f5…`). Wired: `agent-pay.ts` signs (default `X402_EXACT`), `human-do` is the facilitator.
   - Why Permit2: mUSDT has **no EIP-3009** (DOMAIN_SEPARATOR/version/authorizationState revert); Permit2 IS deployed on X Layer (`0x000000000022D473030F116dDEE9F6B43aC78BA3`).
2. **Semantic notary** (`lib/notary.ts`) — photos → Gemini vision, forms → Groq LLM. Confident mismatch → **reject, no payout**.
3. **Proof-freshness challenge** (`lib/challenge.ts`) — per-task code the worker must include (in-frame for photos / a field for forms). Missing code → reject even if the subject is right. Kills stock/replayed photos. Form check is **deterministic** (runs before the LLM).
4. **Explainable verdict** — `NotaryVerdict.checks[]` rendered as ✓/✗ checklist on done/rejected screens ("✗ Freshness code ABC123 visible → Payment rejected").
5. **Vision resilience** — fail-closed (unverifiable photo = held for review, never auto-paid), comma-separated key rotation on 429, `VISION_FALLBACK` provider chain (OpenRouter), verdict cache.
6. **Synchronous settlement** (judge's call) — submit AWAITS the on-chain payout before responding. No `waitUntil`/`@vercel/functions` dependency ("verified but never paid" is impossible). Verified: response returns `settle.success=true` + txHash.
7. **Two-wallet trail** — agent `0x8046e63138bCCCaB69EE1c631ccE9975C7229F00` → payroll `0x4301…` → worker. Distinct addresses.
8. Retry-after-reject (same worker), drag-and-drop upload, reputation leaderboard, settlement ledger, README/docs.
9. **Migrations `002` + `003` APPLIED to Supabase** ✅ (verified: claim no longer collapses expiry).
10. **Production build GREEN** — full `next build` caught + fixed 5 deploy-breaking type errors.

## ✅ Vercel env vars — ALL SET (via API, encrypted)
`AGENT_PRIVATE_KEY`, `VISION_API_KEY` (2 Gemini keys, comma-sep), `VISION_API_URL`, `VISION_MODEL`, `VISION_FALLBACK`, `OPENROUTER_API_KEY`, and **`NEXT_PUBLIC_APP_URL` fixed to `https://groundtruth-oracle.vercel.app`** (was a stale deployment-pinned URL — would have broken MCP self-calls).
Pre-existing: ADMIN_SECRET, SETTLEMENT_PRIVATE_KEY, SUPABASE_*, GROQ_API_KEY, PAYROLL_CONTRACT_ADDRESS, ASP_*, OKX_*.

## ⏳ WHAT'S LEFT
1. **DEPLOY** (gated on user): push `harden-and-polish` → `master` (auto-deploys) or `vercel --prod`. Env vars are ready. Local `.env.local` still says `groundtruth.vercel.app` (harmless locally; prod is correct).
2. **Smoke-test prod** after deploy: create a task, complete it, confirm payout + explorer tx.
3. **Seed durable tasks on prod** so testers/judges always have open missions.
4. Optional: "Try it" guide for testers; Social Buzz launch thread ($10k / 10 winners).
5. Optional polish (judge said not blockers): witness-bind payTo in the x402 signature; standalone `/verify` + `/settle` endpoints.

## Key environment gotchas
- **WSL `/mnt/c` is slow**: first route compile 30–90s, cold DB connections make the first submit ~11–30s. **None of this exists in prod.**
- **`npm install` AND `pnpm add` both FAIL here** (npm `edgesOut`, pnpm hangs) — that's why `@vercel/functions` couldn't be installed, which is why settlement was made synchronous.
- Task creation sometimes fails on the FIRST call after a restart (cold Supabase) — retry succeeds. Test scripts retry 3×.
- Gemini free tier ~20 req/window → 429; rotation to key 2 + OpenRouter fallback covers it.
- Dev server: `PORT=3900 npm run dev` (run detached; `pkill` in the same command kills the new one too).

## Demo assets
- `demo/groundtruth-freshness-demo.webm` — freshness reject beat (silent)
- `demo/groundtruth-full-flow.webm` — earlier full flow (silent)
- **Do NOT add espeak-ng TTS narration** — tried it, sounded terrible, removed (packages purged).
- `docs/DEMO-SCRIPT.md` — tagline ("The missing workforce layer for AI agents"), story frame, 90-sec run, judge Q&A.
- `docs/SYSTEM-OVERVIEW.md` — dev-facing architecture + honest known-gaps.
- `docs/X402-COMPLIANCE-PLAN.md` — x402 research + on-chain findings.

## Working practice
- Automat loop: build → adversarial judge agent scores + finds next gap → fix → repeat.
- Never push to master / deploy to prod without explicit user confirmation.
- Commits: user as sole author, no Co-Authored-By, ever.
