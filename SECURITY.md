# Security

## Scope

GroundTruth is a hackathon project. The following security properties are implemented; everything else is ROADMAP.

## Implemented

| Property | How |
|----------|-----|
| Payment replay prevention | `payments.payment_ref` PRIMARY KEY — duplicate inserts rejected at DB level |
| Claim race condition | Atomic `claim_task()` SQL function with `security definer` — single conditional UPDATE |
| RLS everywhere | All 4 tables have RLS enabled; anon key is read-only for tasks/workers |
| Fail-closed verification | Hard check failures → `failed`; timeout → `needs_review`; never auto-pass |
| Perceptual hash dedup | Recent photo hashes checked; near-duplicates flagged as soft fail |
| Admin auth | `ADMIN_SECRET` header required for all admin endpoints |
| No secrets in git | `.env.local` gitignored; only `.env.local.template` committed |

## Known Limitations (acceptable for hackathon)

- Operator key is a single EOA (not multisig) — ROADMAP: Gnosis Safe
- No rate limiting on worker endpoints
- Admin page uses form POSTs (not fetch) — no CSRF protection
- No webhook signature verification on OKX facilitator callbacks

## Reporting Issues

This is a hackathon project. For issues, open a GitHub issue.
