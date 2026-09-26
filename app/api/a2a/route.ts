import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { respondToAgentMessage } from '@/lib/a2a'
import { rateLimit } from '@/lib/security'

const RequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.literal('SendMessage'),
  params: z.object({
    message: z.object({
      messageId: z.string().min(1).max(200),
      role: z.enum(['ROLE_USER', 'user']),
      parts: z.array(z.object({ text: z.string().min(1).max(4000) }).passthrough()).min(1).max(10),
      contextId: z.string().max(200).optional(),
    }).passthrough(),
  }).passthrough(),
})

function rpcError(id: string | number | null, code: number, message: string, status = 400) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { status })
}

export async function POST(req: NextRequest) {
  if (await rateLimit(req, 'a2a-message', 30)) return rpcError(null, -32029, 'Rate limit exceeded', 429)
  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > 16_384) return rpcError(null, -32600, 'Request is too large', 413)

  const body = await req.json().catch(() => null)
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    const id = body && typeof body === 'object' && ('id' in body) && (typeof body.id === 'string' || typeof body.id === 'number') ? body.id : null
    return rpcError(id, -32600, 'Invalid A2A SendMessage request')
  }

  const requestMessage = parsed.data.params.message
  const text = requestMessage.parts.map(part => part.text).join('\n')
  const contextId = requestMessage.contextId ?? randomUUID()
  return NextResponse.json({
    jsonrpc: '2.0',
    id: parsed.data.id,
    result: {
      message: {
        messageId: randomUUID(),
        contextId,
        role: 'ROLE_AGENT',
        parts: [{ text: respondToAgentMessage(text) }],
      },
    },
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'A2A-Version': '1.0',
    },
  })
}

export function GET() {
  return NextResponse.json({
    protocol: 'A2A',
    version: '1.0',
    agentCard: '/.well-known/agent-card.json',
    method: 'SendMessage',
  }, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
