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
          description: 'An unpaid request may return HTTP 402 with machine-readable payment requirements.',
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
            budget_usdt: { type: 'string', pattern: '^\\d+(\\.\\d{1,6})?$' },
            timeout_seconds: { type: 'integer', minimum: 60, maximum: 86400, default: 3600 },
          },
        },
        TaskCreated: { type: 'object', properties: { task_id: { type: 'string', format: 'uuid' }, status: { type: 'string' }, status_url: { type: 'string', format: 'uri' } } },
      },
    },
  }, { headers: { 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' } })
}
