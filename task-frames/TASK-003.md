# TASK-003 — Supabase Schema, RLS, Atomic Claim, DB Client

**Classification:** Class C (schema + auth boundary)
**Branch:** feat/task-003-db
**Worktree:** .treehouse/TASK-003
**Blocked by:** TASK-002 (imports types)

## Objective
Create the Supabase schema with RLS enforced everywhere, an atomic `claim_task()` SQL function (no read-then-write race), a replay-guarded `payments` table, and a fully typed `lib/db.ts` client. Every write goes through the service role — the anon key is read-only.

## Scope
- `supabase/migrations/001_initial.sql` — tables: `tasks`, `payments`, `workers`, `proof_hashes`; RLS policies; `claim_task()` atomic SQL function; realtime enabled on `tasks`; private storage bucket `proofs`
- `lib/db.ts` — `insertTask`, `getTask`, `transition` (CAS — compare-and-swap, returns null on race), `claimTask` (RPC), `saveProof`, `listOpenTasks`, `recordPaymentRef` (returns false on duplicate = replay), `recordProofHash`, `recentProofHashes`, `bumpWorker`, `pulseStats`

## Out of Scope
- Storage upload (Task 9)
- Settlement (Task 10)

## Constraints
- Service role key ONLY for writes — never anon key server-side
- `transition()` must use `.eq('status', from)` as the CAS condition — not a separate read then write
- `claim_task()` SQL function must be `security definer` and do a single conditional UPDATE
- `payments.payment_ref` is PRIMARY KEY — unique constraint IS the replay guard
- RLS: `tasks` and `workers` allow SELECT for anon; `payments` and `proof_hashes` have no anon policies (service-role only)
- Storage bucket must be created as PRIVATE

## Acceptance Criteria
- [ ] Migration runs in Supabase SQL editor with no errors
- [ ] `pnpm tsc --noEmit` exits 0
- [ ] `claimTask(id, wallet)` returns null when called twice on the same task (race guard works)
- [ ] `recordPaymentRef(ref, ...)` returns `false` on duplicate ref (replay guard works)
- [ ] `listOpenTasks()` only returns tasks with `status='pending'` and `expires_at > now()`

## Required Validation
`pnpm tsc --noEmit` + manual Supabase SQL editor run.

## Stop Conditions
- Migration SQL errors after 2 attempts: escalate to Captain with error text
