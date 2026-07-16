import { createMcpHandler } from 'mcp-handler'

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'ground_truth_info',
      {
        title: 'GroundTruth Info',
        description: 'Get info about the GroundTruth ASP — what it does and how to use it',
        inputSchema: {},
      },
      async () => ({
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              name: 'GroundTruth',
              description: 'Reality-as-a-Service: delegate physical-world tasks to human oracles. Your agent posts a task (photo, form), humans complete it for USDT, you get cryptographically verified proof.',
              endpoint: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/v1/human-do`,
              pricing: { amount: '2.00', currency: 'USDT', network: 'X Layer (196)' },
              proofTypes: ['photo', 'form'],
              docs: 'https://groundtruth.vercel.app',
            }),
          },
        ],
      })
    )
  },
  {},
  {
    basePath: '/api',
  }
)

export { handler as GET, handler as POST }
