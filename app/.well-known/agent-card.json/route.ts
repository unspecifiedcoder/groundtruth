import { groundTruthAgentCard } from '@/lib/a2a'

export function GET() {
  return Response.json(groundTruthAgentCard(), {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      ETag: '"groundtruth-a2a-1.0.0"',
    },
  })
}
