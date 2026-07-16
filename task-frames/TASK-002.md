# TASK-002 — Core Types, State Machine, Money Math

**Classification:** Class B
**Branch:** feat/task-002-core-types
**Worktree:** .treehouse/TASK-002
**Blocked by:** TASK-001 (needs Next.js app + pnpm workspace)

## Objective
Write `lib/types.ts` and `lib/money.ts` — the shared type contract and money primitives that every other task imports. No floats anywhere near money. State machine is fail-closed.

## Scope
- `lib/types.ts` — `Task`, `TaskStatus` (7 states including `needs_review`), `VALID_TRANSITIONS`, `canTransition`, `ProofSpec`, `ProofType` (`photo|form`), `ProofPayload`, `VerificationCheck` (with `severity: 'hard'|'soft'`), `TaskResult` (with `outcome: 'verified'|'failed'|'needs_review'`), `HumanDoInput` (zod), `SubmitProofInput` (zod)
- `lib/money.ts` — `toUnits(usdt: string): bigint`, `fromUnits(units: bigint): string`, `splitBudget(budgetUsdt, feeBps)` — all bigint, 6 decimal USDT, never floats

## Out of Scope
- DB, chain, payment, verification logic

## Constraints
- TypeScript strict mode
- `money.ts` must never use `Number()` or `parseFloat()` for intermediate arithmetic — only bigint
- `TaskStatus` must include: `pending | claimed | submitted | needs_review | verified | failed | expired`
- `VerificationCheck.severity` must be `'hard' | 'soft'` — hard fail = task fails; soft = signal only
- Proof types are `'photo' | 'form'` only (not call/quorum/document — those are ROADMAP)

## Acceptance Criteria
- [ ] `pnpm tsc --noEmit` exits 0
- [ ] `toUnits('2.50')` returns `2500000n`
- [ ] `fromUnits(2500000n)` returns `'2.5'`
- [ ] `splitBudget('2.00', 1200)` returns `{ feeUnits: 240000n, payoutUnits: 1760000n }`
- [ ] `canTransition('submitted', 'needs_review')` returns `true`
- [ ] `canTransition('verified', 'failed')` returns `false`

## Required Validation
`pnpm tsc --noEmit` must pass. Manual node assertions for money math.

## Stop Conditions
- TypeScript errors after 2 attempts: escalate
