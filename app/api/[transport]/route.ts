import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'

const handler = createMcpHandler(
  (server) => {
    // Tool 1: ground_truth_info — free, describes the ASP
    server.tool(
      'ground_truth_info',
      'Get info about the GroundTruth ASP — what it does, pricing, and how to call it',
      {},
      async () => ({
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              name: 'GroundTruth',
              tagline: 'Reality-as-a-Service for AI agents',
              description:
                'Delegate physical-world tasks to human oracles. Post a task (photo or form), a human completes it, you receive cryptographically verified proof — all settled on-chain.',
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
              example_intents: [
                'Take a photo of the parking availability at 123 Main St',
                'Check if this restaurant is currently open and has available tables',
                'Confirm the listed price of product X at store Y',
              ],
            }),
          },
        ],
      })
    )

    // Tool 2: human_do — paid tool, creates a task (agent must include x402 payment)
    server.tool(
      'human_do',
      'Create a task for a human oracle to complete in the real world. Requires x402 payment. Returns a task_id to poll with task_status.',
      {
        intent: z.string().min(1).max(500).describe('What you want the human to do'),
        proof_type: z
          .enum(['photo', 'form'])
          .describe('Type of proof: photo for visual verification, form for structured data'),
        instructions: z
          .string()
          .min(1)
          .max(1000)
          .describe('Detailed instructions for the human'),
        budget_usdt: z
          .string()
          .regex(/^\d+(\.\d{1,6})?$/)
          .optional()
          .default('2.00')
          .describe('Budget in USDT (default 2.00)'),
        timeout_seconds: z
          .number()
          .int()
          .min(60)
          .max(86400)
          .optional()
          .default(3600)
          .describe('Task timeout in seconds'),
      },
      async ({ intent, proof_type, instructions, budget_usdt, timeout_seconds }) => {
        // This tool signals that payment is needed — the actual task creation
        // happens at POST /api/v1/human-do with x402 payment header.
        // The MCP tool returns instructions on how to pay and proceed.
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                status: 'payment_required',
                message:
                  'To create this task, POST to the endpoint below with an x402 payment header.',
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
                note: 'Send a GET or empty POST to the endpoint to receive the 402 challenge with payment details.',
              }),
            },
          ],
        }
      }
    )

    // Tool 3: task_status — free, polls task result
    server.tool(
      'task_status',
      'Check the status and result of a GroundTruth task by its task_id',
      {
        task_id: z.string().uuid().describe('The task ID returned by human_do'),
      },
      async ({ task_id }) => {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
          const res = await fetch(`${appUrl}/api/v1/tasks/${task_id}`, {
            signal: AbortSignal.timeout(5000),
          })
          if (!res.ok) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({ error: 'Task not found', task_id }),
                },
              ],
            }
          }
          const task = await res.json()
          return {
            content: [
              {
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
              },
            ],
          }
        } catch {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({ error: 'Failed to fetch task status', task_id }),
              },
            ],
          }
        }
      }
    )
  },
  {
    name: 'GroundTruth',
    version: '0.1.0',
  },
  {
    redactedTools: [],
  }
)

export const { GET, POST } = handler
