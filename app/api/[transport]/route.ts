import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'

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
            description: 'Delegate physical-world tasks to human oracles. Post a task (photo or form), a human completes it, you receive cryptographically verified proof — all settled on-chain.',
            endpoint: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/v1/human-do`,
            method: 'POST',
            authentication: 'x402 payment header required',
            pricing: {
              amount: process.env.ASP_PRICE_USDT ?? '2.00',
              currency: 'USDT',
              network: 'X Layer (chainId 196)',
              fee_bps: process.env.ASP_FEE_BPS ?? '1200',
            },
            proof_types: {
              photo: 'Agent asks for a photo; human takes it on-site and uploads',
              form: 'Agent asks for structured data; human fills a form',
            },
            typical_completion: '5–15 minutes',
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
        const adminSecret = process.env.ADMIN_SECRET
        // Use demo bypass if ADMIN_SECRET is set — allows MCP callers to create tasks directly
        if (adminSecret) {
          try {
            const res = await fetch(`${appUrl}/api/v1/human-do`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-DEMO-KEY': adminSecret,
              },
              body: JSON.stringify({
                intent,
                proof_spec: {
                  type: proof_type,
                  instructions,
                  ...(proof_type === 'photo' ? { minPhotos: 1 } : {}),
                },
                budget_usdt: budget_usdt ?? '2.00',
                timeout_seconds: timeout_seconds ?? 3600,
              }),
              signal: AbortSignal.timeout(10000),
            })
            const data = await res.json()
            if (res.ok) {
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({
                    status: 'created',
                    task_id: data.task_id,
                    budget_usdt: data.budget_usdt ?? budget_usdt ?? '2.00',
                    expires_at: data.expires_at,
                    poll_url: data.poll_url ?? `${appUrl}/api/v1/tasks/${data.task_id}`,
                    board_url: `${appUrl}/tasks/${data.task_id}`,
                    message: 'Task created and posted to the oracle board. Use task_status to poll for completion.',
                  }),
                }],
              }
            }
          } catch {
            // fall through to payment_required
          }
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              status: 'payment_required',
              message: 'To create this task, POST to the endpoint below with an x402 payment header.',
              endpoint: `${appUrl}/api/v1/human-do`,
              method: 'POST',
              required_header: 'X-PAYMENT: <base64-encoded x402 payment>',
              body: {
                intent,
                proof_spec: {
                  type: proof_type,
                  instructions,
                  ...(proof_type === 'photo' ? { minPhotos: 1 } : {}),
                },
                budget_usdt: budget_usdt ?? '2.00',
                timeout_seconds: timeout_seconds ?? 3600,
              },
              x402_challenge_endpoint: `${appUrl}/api/v1/human-do`,
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
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                task_id: task.id,
                status: task.status,
                intent: task.intent,
                result: task.result ?? null,
                proof_available: task.status === 'verified',
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
  },
  {},
  {
    basePath: '/api',
    maxDuration: 60,
  }
)

export const GET = handler
export const POST = handler
