import packageJson from '@/package.json'

export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({
    service: 'groundtruth',
    version: packageJson.version,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    revision: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    built_at: process.env.BUILD_TIMESTAMP ?? null,
  })
}
