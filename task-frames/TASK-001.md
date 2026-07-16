# TASK-001 — Scaffold, Stub Endpoints, Deploy, Register ASP

**Classification:** Class C (multi-surface, deployment, public contract)
**Branch:** feat/task-001-scaffold
**Worktree:** .treehouse/TASK-001

## Objective
Bootstrap the Next.js 14 app in the repo root, write the `.env.local` template, `lib/config.ts`, a deployable x402 stub at `POST /api/v1/human-do`, a deployable MCP stub at `/api/[transport]`, and get a live Vercel URL. Then pull OKX's `onchainos-skills` and register the ASP listing on OKX.AI (Task 1 is the eligibility gate — review clock must start today).

## Scope
- `npx create-next-app@14.2.5 . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-pnpm --no-eslint` in repo root
- `pnpm add mcp-handler zod@^3.23 @supabase/supabase-js viem exifr sharp`
- `.env.local` template (all keys, no real values)
- `lib/config.ts` — typed env accessors, throws on missing required vars
- `app/api/v1/human-do/route.ts` — STUB: returns HTTP 402 + x402 challenge JSON, no real payment logic
- `app/api/[transport]/route.ts` — STUB: MCP streamable HTTP, exposes `ground_truth_info` tool only
- `vercel.json` — `{ "framework": "nextjs" }`
- `pnpm build` must pass locally
- Deploy to Vercel (`npx vercel --prod`)
- Smoke the live URL (402 + MCP tools/list)
- `npx skills add okx/onchainos-skills` and grep for x402/facilitator values
- Register ASP on okx.ai/tutorial/asp — record Agent ID in `docs/agent-id.txt`

## Out of Scope
- Real payment logic (Task 5)
- Supabase (Task 3)
- Contract (Task 4)
- Any UI beyond the stubs

## Constraints
- Node 22 (`export NVM_DIR="$HOME/.nvm" && \. "$NVM_DIR/nvm.sh"`)
- TypeScript strict mode
- `pnpm` only — no npm/yarn
- Do NOT commit `.env.local` — it must be in `.gitignore`
- `app/api/[transport]/route.ts` filename is literal — the `[transport]` dynamic segment is required by `mcp-handler`

## Acceptance Criteria
- [ ] `pnpm build` exits 0 locally
- [ ] `curl -s -X POST https://DOMAIN/api/v1/human-do -H 'content-type: application/json' -d '{"intent":"test","budget_usdt":"1.00"}' | grep x402Version` returns match
- [ ] `curl -s -X POST https://DOMAIN/api/mcp -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | grep ground_truth_info` returns match
- [ ] `docs/agent-id.txt` exists and contains the OKX.AI Agent ID
- [ ] `git log --oneline` shows a clean commit

## Risks
- `.claude/` directory in root conflicts with `create-next-app` — move it aside before scaffold, restore after
- `mcp-handler` requires `[transport]` dynamic segment in the route path exactly
- OKX skills install may require Node path — source nvm first

## Required Validation
`pnpm build` + both curl smokes above must pass. Validator runs these exactly.

## Stop Conditions
- If `pnpm build` fails after 3 attempts: escalate to Captain
- If Vercel deploy fails: escalate, do not retry destructively
- If OKX registration fails: record the error in `docs/agent-id.txt` and escalate — do not block other tasks
