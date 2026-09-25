import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SETTLEMENT_PRIVATE_KEY', 'GROQ_API_KEY', 'CLAIM_TOKEN_SECRET']
  const missing = required.filter(key => !process.env[key])
  let database: 'ok' | 'error' | 'not_configured' = 'not_configured'
  let campaignsMigration = false

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    const [taskCheck, campaignCheck, hardeningCheck] = await Promise.all([
      db.from('tasks').select('id', { head: true, count: 'exact' }).limit(1),
      db.from('campaigns').select('id', { head: true, count: 'exact' }).limit(1),
      db.from('audit_events').select('id', { head: true, count: 'exact' }).limit(1),
    ])
    database = taskCheck.error ? 'error' : 'ok'
    campaignsMigration = !campaignCheck.error
    if (hardeningCheck.error) missing.push('DATABASE_MIGRATION_005')
  }

  const ready = missing.length === 0 && database === 'ok' && campaignsMigration
  return Response.json({
    status: ready ? 'ready' : 'degraded',
    service: 'groundtruth',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    revision: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    checks: { database, campaigns_migration: campaignsMigration, required_configuration: missing.length === 0 },
    ...(ready ? {} : { action_required: { missing_environment_variables: missing, campaigns_migration: campaignsMigration ? 'applied' : 'apply supabase/migrations/004_campaigns.sql' } }),
  }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
