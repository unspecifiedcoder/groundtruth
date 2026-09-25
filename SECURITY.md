# Security

## Scope

GroundTruth is a public-beta project. This document describes controls in the application and the deployment requirements that must be satisfied before commercial traffic is enabled.

## Implemented

| Property | How |
|----------|-----|
| Payment replay prevention | Unique payment references and on-chain transaction hashes prevent re-use |
| Claim race condition | Atomic `claim_task()` SQL function with `security definer` — single conditional UPDATE |
| Direct database access | RLS enabled; migration 005 revokes anonymous table and privileged-RPC access |
| Fail-closed verification | Hard check failures → `failed`; timeout → `needs_review`; never auto-pass |
| Perceptual hash dedup | Recent photo hashes checked; near-duplicates flagged as soft fail |
| Worker claim authorization | Expiring HMAC claim token binds a task to the claiming wallet |
| Buyer evidence authorization | Campaign capability is exchanged from a URL fragment into a secure, HttpOnly cookie |
| Rate limiting | Persistent database limiter after migration 005, plus a per-instance backstop |
| Upload defense | Size, count, MIME allow-list, binary signature checks, and private storage constraints |
| Browser hardening | CSP, HSTS, frame denial, permissions policy, strict referrer policy, and same-origin mutation checks |
| Admin auth | Constant-time `ADMIN_SECRET` validation required for operations endpoints |
| No secrets in git | `.env.local` gitignored; only `.env.local.template` committed |
| Audit trail | Append-only service-role audit events for campaign, claim, submission, and review actions |

## Production requirements

- Apply database migrations through `005_production_hardening.sql`.
- Set separate random values for `ADMIN_SECRET`, `PILOT_ACCESS_KEY`, and `CLAIM_TOKEN_SECRET`.
- Keep `RECEIPTS_PUBLIC=false`, `ENABLE_TESTNET_FAUCET=false`, and `AUTO_ACCEPT=false` until a reviewed launch decision.
- Use separate Supabase and settlement environments for development, preview, and production.
- Move production settlement authority to an approved custody or multisig arrangement; do not rely on a long-lived EOA in a general-availability launch.
- Configure external uptime/error monitoring against `/api/health`, log retention, backups, and incident contacts.
- Execute signed customer terms, privacy/retention terms, refund/dispute rules, and worker onboarding requirements for every operating geography.

## Reporting Issues

Use the contact in `/.well-known/security.txt`. Do not include secrets, private evidence, or worker location data in a public issue.
