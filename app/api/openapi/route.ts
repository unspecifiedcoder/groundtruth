export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
  return Response.json({
    openapi: '3.1.0',
    info: {
      title: 'GroundTruth API',
      version: '1.0.0-beta',
      description: 'Create paid field-evidence missions and poll for verified results. MCP clients should use /api/mcp.',
      contact: { url: `${base}/developers` },
    },
    servers: [{ url: base }],
    paths: {
      '/api/v1/human-do': {
        post: {
          operationId: 'createFieldMission',
          summary: 'Create a paid asynchronous field mission',
          description: 'Select a server-priced service tier. An unpaid request returns HTTP 402 with the exact machine-readable payment requirement. Use evaluation_test for a $0.10 paid review or quick_check for a basic $2 field mission; integration_test remains a $0.01 machine-compatibility probe.',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HumanDoInput' } } } },
          responses: {
            '201': { description: 'Mission created', content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskCreated' } } } },
            '402': { description: 'Payment required' },
            '429': { description: 'Rate limited' },
          },
        },
      },
      '/api/v1/tasks/{id}': {
        get: {
          operationId: 'getFieldMission',
          summary: 'Poll mission, proof, and settlement status',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { '200': { description: 'Current mission state' }, '404': { description: 'Mission not found' }, '429': { description: 'Rate limited' } },
        },
      },
      '/api/auth/wallet/challenge': {
        post: {
          operationId: 'createWalletChallenge',
          summary: 'Create a short-lived wallet ownership challenge',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['wallet'], properties: { wallet: { $ref: '#/components/schemas/WalletAddress' } } } } } },
          responses: { '200': { description: 'Message and signed challenge token' }, '400': { description: 'Invalid wallet' }, '429': { description: 'Rate limited' } },
        },
      },
      '/api/auth/wallet/verify': {
        post: {
          operationId: 'verifyWalletOwnership',
          summary: 'Verify a wallet signature and establish a secure worker session',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['wallet', 'message', 'challenge_token', 'signature'], properties: { wallet: { $ref: '#/components/schemas/WalletAddress' }, message: { type: 'string' }, challenge_token: { type: 'string' }, signature: { type: 'string' } } } } } },
          responses: { '200': { description: 'Wallet verified; sets an HttpOnly session cookie' }, '401': { description: 'Challenge or signature rejected' }, '429': { description: 'Rate limited' } },
        },
      },
      '/api/pilot-leads': {
        post: {
          operationId: 'requestFundedPilot',
          summary: 'Apply for a scoped retail evidence pilot',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PilotLead' } } } },
          responses: { '201': { description: 'Application received' }, '400': { description: 'Invalid application' }, '429': { description: 'Rate limited' }, '503': { description: 'Lead intake unavailable' } },
        },
      },
      '/api/health': { get: { operationId: 'health', summary: 'Liveness and dependency readiness', responses: { '200': { description: 'Healthy' }, '503': { description: 'Not ready' } } } },
    },
    components: {
      schemas: {
        HumanDoInput: {
          type: 'object', required: ['intent'], additionalProperties: false,
          properties: {
            intent: { type: 'string', maxLength: 500, example: 'Check shelf availability and price for Brand A at Store 42' },
            target_location: { type: 'object', required: ['label', 'latitude', 'longitude'], properties: { label: { type: 'string' }, latitude: { type: 'number', minimum: -90, maximum: 90 }, longitude: { type: 'number', minimum: -180, maximum: 180 }, radius_meters: { type: 'integer', minimum: 25, maximum: 5000, default: 150 } } },
            proof_spec: { type: 'object', properties: { type: { enum: ['photo', 'form'] }, instructions: { type: 'string' }, minPhotos: { type: 'integer', minimum: 1, maximum: 5 }, formFields: { type: 'array', items: { type: 'string' } } } },
            service_tier: { enum: ['integration_test', 'evaluation_test', 'quick_check', 'photo_visit', 'urgent_visit', 'complex_visit'], default: 'integration_test', description: 'Prices: 0.01, 0.10, 2.00, 5.00, 15.00, and 50.00 USDC or USDT0 respectively. Use evaluation_test for a paid product review and quick_check for the smallest field mission.' },
            budget_usdt: { type: 'string', pattern: '^\\d+(\\.\\d{1,6})?$', deprecated: true, description: 'Legacy compatibility. Only exact canonical tier prices are recognized.' },
            timeout_seconds: { type: 'integer', minimum: 60, maximum: 86400, default: 3600 },
          },
        },
        TaskCreated: { type: 'object', properties: { task_id: { type: 'string', format: 'uuid' }, status: { type: 'string' }, service_tier: { type: 'string' }, budget_usdt: { type: 'string' }, funded: { type: 'boolean' }, dispatch: { enum: ['public_worker_board', 'unfunded_not_claimable'] }, poll_url: { type: 'string', format: 'uri' } } },
        WalletAddress: { type: 'string', pattern: '^0x[0-9a-fA-F]{40}$', example: '0x1111111111111111111111111111111111111111' },
        PilotLead: {
          type: 'object', required: ['company_name', 'contact_name', 'work_email', 'use_case', 'launch_city', 'estimated_locations', 'timeline'], additionalProperties: false,
          properties: {
            company_name: { type: 'string', minLength: 2, maxLength: 120 },
            contact_name: { type: 'string', minLength: 2, maxLength: 120 },
            work_email: { type: 'string', format: 'email', maxLength: 200 },
            use_case: { type: 'string', minLength: 20, maxLength: 1500 },
            launch_city: { type: 'string', minLength: 2, maxLength: 120 },
            estimated_locations: { type: 'integer', minimum: 1, maximum: 100000 },
            timeline: { enum: ['this_month', 'this_quarter', 'exploring'] },
          },
        },
      },
    },
  }, { headers: { 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' } })
}
