import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SETTLEMENT_PRIVATE_KEY', 'GROQ_API_KEY', 'CLAIM_TOKEN_SECRET']
  const missing = required.filter(key => !process.env[key])
  let database: 'ok' | 'error' | 'not_configured' = 'not_configured'
  let evidenceStorage: 'ok' | 'error' | 'not_configured' = 'not_configured'
  let campaignsMigration = false
  let hardeningMigration = false

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    const [taskCheck, campaignCheck, auditCheck, limiterCheck, bucketCheck] = await Promise.all([
      db.from('tasks').select('id', { head: true, count: 'exact' }).limit(1),
      db.from('campaigns').select('id', { head: true, count: 'exact' }).limit(1),
      db.from('audit_events').select('id', { head: true, count: 'exact' }).limit(1),
      db.from('api_rate_limits').select('key', { head: true, count: 'exact' }).limit(1),
      db.storage.getBucket('proofs'),
    ])
    database = taskCheck.error ? 'error' : 'ok'
    evidenceStorage = bucketCheck.error ? 'error' : 'ok'
    campaignsMigration = !campaignCheck.error
    hardeningMigration = !auditCheck.error && !limiterCheck.error
    if (!hardeningMigration) missing.push('DATABASE_MIGRATION_005')
    if (evidenceStorage !== 'ok') missing.push('EVIDENCE_STORAGE_BUCKET')
  }

  const safety = {
    manual_review: process.env.AUTO_ACCEPT === 'false',
    private_receipts: process.env.RECEIPTS_PUBLIC !== 'true',
    faucet_disabled: process.env.ENABLE_TESTNET_FAUCET !== 'true',
    wallet_signature_required: process.env.REQUIRE_WALLET_SIGNATURE === 'true',
    unfunded_campaign_publication_blocked: process.env.ALLOW_OPERATOR_FUNDED_CAMPAIGNS !== 'true',
  }
  const safetyReady = Object.values(safety).every(Boolean)
  if (!safetyReady) missing.push('PRODUCTION_SAFETY_FLAGS')
  const ready = missing.length === 0 && database === 'ok' && evidenceStorage === 'ok' && campaignsMigration && hardeningMigration
  return Response.json({
    status: ready ? 'ready' : 'degraded',
    service: 'groundtruth',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    revision: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    checks: { database, evidence_storage: evidenceStorage, campaigns_migration: campaignsMigration, hardening_migration: hardeningMigration, production_safety: safety, required_configuration: missing.length === 0 },
    ...(ready ? {} : { action_required: { missing_or_unsafe: missing, campaigns_migration: campaignsMigration ? 'applied' : 'apply supabase/migrations/004_campaigns.sql', hardening_migration: hardeningMigration ? 'applied' : 'apply supabase/migrations/005_production_hardening.sql' } }),
  }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
