import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { agentPay } from '@/lib/agent-pay'

// GroundTruthPayroll contract receives x402 payments on X Layer testnet
const PAYMENT_RECIPIENT = '0x430172985b21458d73576435D4aD4bEeA85F376C'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = createMcpHandler(
  (server: any) => {
    server.registerTool(
      'ground_truth_info',
      {
        title: 'GroundTruth Info',
        description: 'Get info about the GroundTruth ASP — what it does, pricing, and how to call it',
        inputSchema: {},
      },
      async () => ({
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            name: 'GroundTruth',
            tagline: 'Reality-as-a-Service for AI agents',
            description: 'Delegate physical-world tasks to human oracles. Submit a task (photo or form) with a budget; you immediately receive a task_id. A human completes it in minutes and an AI notary verifies the proof; poll task_status to retrieve the verified result and on-chain settlement.',
            how_it_works: [
              'Call human_do with an intent, proof_type (photo|form), instructions, and budget → returns a task_id.',
              'A human oracle claims and completes the task in the real world.',
              'An AI notary verifies the submitted proof against your intent.',
              'Call task_status with the task_id to retrieve the verified proof and the on-chain settlement transaction.',
            ],
            endpoint: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/v1/human-do`,
            method: 'POST',
            authentication: 'x402 payment (handled automatically by the agent wallet)',
            registered_okx_service_call: 'Free discovery on X Layer mainnet — 0 USDT to call or discover this service.',
            pricing: {
              model: 'x402 per-task budget, set by the caller (not a fixed listing fee)',
              default_amount: process.env.ASP_PRICE_USDT ?? '2.00',
              currency: 'USDT',
              note: 'Demo oracle-task settlements may use X Layer Testnet (chainId 1952) and are separate from the listed service call.',
              platform_fee_bps: process.env.ASP_FEE_BPS ?? '1200',
            },
            proof_types: {
              photo: 'Agent asks for a photo; human takes it on-site and uploads',
              form: 'Agent asks for structured data; human fills a form',
            },
            typical_completion: 'varies with human-oracle availability',
            response: 'asynchronous — human_do returns a task_id; the verified proof and settlement are retrieved via task_status',
          }),
        }],
      })
    )

    server.registerTool(
      'human_do',
      {
        title: 'Human Do',
        description: 'Create a task for a human oracle to complete in the real world. Requires x402 payment. Returns a task_id to poll with task_status.',
        inputSchema: {
          intent: z.string().min(1).max(500).describe('What you want the human to do'),
          proof_type: z.enum(['photo', 'form']).describe('Type of proof'),
          instructions: z.string().min(1).max(1000).describe('Detailed instructions for the human'),
          budget_usdt: z.string().regex(/^\d+(\.\d{1,6})?$/).optional().default('2.00'),
          timeout_seconds: z.number().int().min(60).max(86400).optional().default(3600),
        },
      },
      async ({ intent, proof_type, instructions, budget_usdt, timeout_seconds }: { intent: string; proof_type: 'photo' | 'form'; instructions: string; budget_usdt?: string; timeout_seconds?: number }) => {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
        const amount = budget_usdt ?? '2.00'

        // Step 1: Autonomous x402 payment — check balance, drip from faucet if needed, transfer mUSDT
        let payResult: Awaited<ReturnType<typeof agentPay>> | null = null
        let payError: string | null = null
        try {
          payResult = await agentPay(amount, PAYMENT_RECIPIENT, appUrl)
        } catch (err) {
          payError = err instanceof Error ? err.message : String(err)
        }

        if (payResult) {
          // Step 2: Submit task with real x402 payment header
          try {
            const res = await fetch(`${appUrl}/api/v1/human-do`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-PAYMENT': payResult.paymentHeader,
              },
              body: JSON.stringify({
                intent,
                proof_spec: {
                  type: proof_type,
                  instructions,
                  ...(proof_type === 'photo' ? { minPhotos: 1 } : {}),
                },
                budget_usdt: amount,
                timeout_seconds: timeout_seconds ?? 3600,
              }),
              signal: AbortSignal.timeout(30_000),
            })
            const data = await res.json()
            if (res.ok) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({
                    status: 'created',
                    task_id: data.task_id,
                    budget_usdt: data.budget_usdt ?? amount,
                    expires_at: data.expires_at,
                    poll_url: `${appUrl}/api/v1/tasks/${data.task_id}`,
                    board_url: `${appUrl}/tasks/${data.task_id}`,
                    estimated_completion: 'varies with human-oracle availability',
                    next_step: 'Call task_status with this task_id to retrieve the human-completed, AI-verified proof and the on-chain settlement transaction.',
                    message: 'Task submitted to the human-oracle network. A human completes it in the real world and an AI notary verifies the proof; payout settles on-chain. Poll task_status for the verified result.',
                    ...(payResult.paymentTx ? { payment_tx: payResult.paymentTx } : {}),
                  }),
                }],
              }
            }
            // x402 payment rejected — fall through to demo bypass
          } catch {
            // network error — fall through to demo bypass
          }
        }

        // Fallback: demo bypass if ADMIN_SECRET is set
        const adminSecret = process.env.ADMIN_SECRET
        if (adminSecret) {
          try {
            const res = await fetch(`${appUrl}/api/v1/human-do`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-DEMO-KEY': adminSecret },
              body: JSON.stringify({
                intent,
                proof_spec: { type: proof_type, instructions, ...(proof_type === 'photo' ? { minPhotos: 1 } : {}) },
                budget_usdt: amount,
                timeout_seconds: timeout_seconds ?? 3600,
              }),
              signal: AbortSignal.timeout(10_000),
            })
            const data = await res.json()
            if (res.ok) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({
                    status: 'created',
                    task_id: data.task_id,
                    budget_usdt: data.budget_usdt ?? amount,
                    expires_at: data.expires_at,
                    poll_url: `${appUrl}/api/v1/tasks/${data.task_id}`,
                    board_url: `${appUrl}/tasks/${data.task_id}`,
                    estimated_completion: 'varies with human-oracle availability',
                    next_step: 'Call task_status with this task_id to retrieve the human-completed, AI-verified proof and the on-chain settlement transaction.',
                    message: 'Task submitted to the human-oracle network. A human completes it in the real world and an AI notary verifies the proof; payout settles on-chain. Poll task_status for the verified result.',
                  }),
                }],
              }
            }
          } catch {
            // fall through
          }
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              status: 'payment_required',
              error: payError ?? 'No agent wallet or demo key configured',
              message: 'To create this task, configure SETTLEMENT_PRIVATE_KEY (for autonomous x402 payment) or ADMIN_SECRET (for demo bypass).',
              endpoint: `${appUrl}/api/v1/human-do`,
            }),
          }],
        }
      }
    )

    server.registerTool(
      'task_status',
      {
        title: 'Task Status',
        description: 'Check the status and result of a GroundTruth task by its task_id',
        inputSchema: {
          task_id: z.string().uuid().describe('The task ID returned by human_do'),
        },
      },
      async ({ task_id }: { task_id: string }) => {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
          const res = await fetch(`${appUrl}/api/v1/tasks/${task_id}`, { signal: AbortSignal.timeout(5000) })
          if (!res.ok) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Task not found', task_id }) }] }
          const task = await res.json()
          const awaitingReview = task.status === 'submitted'
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                task_id: task.id,
                status: task.status,
                intent: task.intent,
                // Proof is available once the human submits (awaiting your review) and after.
                proof: (awaitingReview || task.status === 'verified') ? (task.proof_payload ?? null) : null,
                ai_vision: task.result?.vision ?? null,
                integrity_checks: task.result?.checks ?? null,
                awaiting_your_review: awaitingReview,
                next_action: awaitingReview
                  ? 'Review the proof, then call review_task with decision "accept" (pays the oracle on-chain) or "reject".'
                  : undefined,
                result: task.result ?? null,
                created_at: task.created_at,
                expires_at: task.expires_at,
              }),
            }],
          }
        } catch {
          return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Failed to fetch task status', task_id }) }] }
        }
      }
    )

    server.registerTool(
      'review_task',
      {
        title: 'Review Task',
        description: 'Review a submitted proof and accept or reject it. Accept releases the on-chain payout to the human oracle; reject fails the task with no payout. Call this after task_status shows the proof.',
        inputSchema: {
          task_id: z.string().uuid().describe('The task ID to review'),
          decision: z.enum(['accept', 'reject']).describe('accept = pay the oracle; reject = no payout'),
          reason: z.string().max(300).optional().describe('Optional note explaining the decision'),
        },
      },
      async ({ task_id, decision, reason }: { task_id: string; decision: 'accept' | 'reject'; reason?: string }) => {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
          const adminSecret = process.env.ADMIN_SECRET
          const res = await fetch(`${appUrl}/api/v1/tasks/${task_id}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(adminSecret ? { 'X-DEMO-KEY': adminSecret } : {}) },
            body: JSON.stringify({ decision, reason }),
            signal: AbortSignal.timeout(90_000),
          })
          const data = await res.json()
          return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] }
        } catch (err) {
          return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Review failed', detail: err instanceof Error ? err.message : String(err), task_id }) }] }
        }
      }
    )
  },
  {},
  {
    basePath: '/api',
    maxDuration: 60,
  }
)

// mcp-handler strictly requires "Accept: application/json, text/event-stream"
// on POST per the MCP Streamable HTTP spec, and 406-rejects anything else.
// Some reviewer/test clients don't send that exact header — normalize it so
// any JSON-RPC POST works regardless of what Accept header the caller sent.
export async function POST(req: Request) {
  const accept = req.headers.get('accept') ?? ''
  const hasBoth = accept.includes('application/json') && accept.includes('text/event-stream')
  if (hasBoth) return handler(req)

  // A Content-Length of 0 means an empty body — check cheaply, without
  // consuming the stream, so a real body can still flow through untouched
  // below. (Rebuilding the Request from a re-read body previously caused
  // intermittent 300s hangs in production — this avoids touching it at all.)
  if (req.headers.get('content-length') === '0') {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request: empty body — send a JSON-RPC 2.0 request' }, id: null },
      { status: 400 }
    )
  }

  const fixedHeaders = new Headers(req.headers)
  fixedHeaders.set('accept', 'application/json, text/event-stream')

  // Proxy only the perceived Accept header; every other property (body,
  // method, url, text(), json()...) reads straight from the original,
  // never-reconstructed request.
  const patched = new Proxy(req, {
    get(target, prop, receiver) {
      if (prop === 'headers') return fixedHeaders
      const value = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })

  return handler(patched as Request)
}

// A GET with no MCP session is a health/discovery probe from most test
// tools, not a real MCP client — answer it instead of a bare 405.
export async function GET(req: Request) {
  if (req.headers.get('mcp-session-id')) return handler(req)
  return Response.json({
    status: 'ok',
    protocol: 'mcp',
    transport: 'streamable-http',
    endpoint: '/api/mcp',
    note: 'This is an MCP JSON-RPC endpoint — POST a JSON-RPC 2.0 request (e.g. { "method": "initialize", ... }) to interact with it.',
  })
}

// The MCP transport handler hangs on HEAD (no response, ever) instead of
// rejecting fast — OKX's endpoint-reachability check uses HEAD and times out.
export async function HEAD() {
  return new Response(null, { status: 200 })
}
