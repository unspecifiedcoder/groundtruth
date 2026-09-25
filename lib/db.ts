import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Task, TaskStatus, TaskResult, ProofPayload, Campaign } from './types'
import { assessWorkerRisk, type WorkerRiskDecision } from './risk'
import { calculateOperationsMetrics, type MetricTask } from './metrics'

// Service-role client — used server-side only, never exposed to browser
function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function withDbRetry<T extends { error: unknown }>(operation: () => PromiseLike<T>, attempts = 2): Promise<T> {
  let result = await operation()
  for (let attempt = 1; result.error && attempt < attempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, attempt * 200))
    result = await operation()
  }
  return result
}

// Anon client — safe for browser use, read-only via RLS
export function getAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase public env vars missing')
  return createClient(url, key)
}

export async function insertTask(params: {
  intent: string
  proof_spec: object
  budget_usdt: string
  expires_at: Date
  payment_ref: string
}): Promise<Task> {
  const db = getServiceClient()
  const { data, error } = await db
    .from('tasks')
    .insert({
      intent: params.intent,
      proof_spec: params.proof_spec,
      budget_usdt: params.budget_usdt,
      expires_at: params.expires_at.toISOString(),
      payment_ref: params.payment_ref,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  return data as Task
}

export async function createCampaignWithTasks(params: {
  campaign: {
    name: string
    customer_name: string
    brief: string
    access_token_hash: string
    budget_per_task_usdt: string
    expires_at: string
  }
  tasks: Array<{
    intent: string
    proof_spec: object
    budget_usdt: string
    expires_at: string
    payment_ref: string
  }>
}): Promise<Campaign> {
  const db = getServiceClient()
  const { data: campaign, error: campaignError } = await db
    .from('campaigns')
    .insert({ ...params.campaign, status: 'active' })
    .select('id,name,customer_name,brief,status,budget_per_task_usdt,created_at,expires_at')
    .single()
  if (campaignError) throw campaignError

  const taskRows = params.tasks.map(task => ({ ...task, campaign_id: campaign.id, status: 'pending' }))
  const { error: tasksError } = await db.from('tasks').insert(taskRows)
  if (tasksError) {
    await db.from('campaigns').delete().eq('id', campaign.id)
    throw tasksError
  }
  return campaign as Campaign
}

export async function getCampaignWithTasks(id: string): Promise<{ campaign: Campaign & { access_token_hash: string }; tasks: Task[] } | null> {
  const db = getServiceClient()
  const [{ data: campaign, error: campaignError }, { data: tasks, error: tasksError }] = await Promise.all([
    db.from('campaigns').select().eq('id', id).single(),
    db.from('tasks').select().eq('campaign_id', id).order('created_at', { ascending: true }),
  ])
  if (campaignError || tasksError || !campaign) return null
  return { campaign: campaign as Campaign & { access_token_hash: string }, tasks: (tasks ?? []) as Task[] }
}

// Best-effort delete — used to clean up an orphan task when payment recording
// fails (e.g. a replayed payment) so no unpaid task lingers on the board.
export async function deleteTask(id: string): Promise<void> {
  const db = getServiceClient()
  await db.from('tasks').delete().eq('id', id)
}

export async function getTask(id: string): Promise<Task | null> {
  const db = getServiceClient()
  const { data, error } = await db
    .from('tasks')
    .select()
    .eq('id', id)
    .single()
  if (error) return null
  return data as Task
}

export async function getWorkerClaimEligibility(wallet: string): Promise<WorkerRiskDecision> {
  const db = getServiceClient()
  const normalized = wallet.toLowerCase()
  const [{ data: worker }, { count: activeClaims }] = await Promise.all([
    db.from('workers').select('tasks_completed,tasks_failed').ilike('wallet', normalized).maybeSingle(),
    db.from('tasks').select('id', { head: true, count: 'exact' }).ilike('worker_wallet', normalized).in('status', ['claimed', 'submitted', 'needs_review']),
  ])
  return assessWorkerRisk({
    completed: Number(worker?.tasks_completed ?? 0),
    failed: Number(worker?.tasks_failed ?? 0),
    activeClaims: activeClaims ?? 0,
  })
}

export async function uploadProofFile(params: {
  taskId: string
  fileName: string
  bytes: Buffer
  contentType: string
}): Promise<string> {
  const db = getServiceClient()
  const extension = params.fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${params.taskId}/${crypto.randomUUID()}.${extension}`
  const { error } = await db.storage.from('proofs').upload(path, params.bytes, {
    contentType: params.contentType || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function createProofUrls(paths: string[], expiresIn = 3600): Promise<string[]> {
  if (!paths.length) return []
  const db = getServiceClient()
  const { data, error } = await db.storage.from('proofs').createSignedUrls(paths, expiresIn)
  if (error) return []
  return data.map(item => item.signedUrl).filter((url): url is string => !!url)
}

export async function recordAuditEvent(params: {
  event_type: string
  actor_type: 'buyer' | 'worker' | 'agent' | 'operator' | 'system'
  actor_ref?: string
  resource_type: 'campaign' | 'task' | 'payment' | 'evidence' | 'pilot_lead'
  resource_id: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const db = getServiceClient()
  const { error } = await db.from('audit_events').insert({ ...params, metadata: params.metadata ?? {} })
  if (error) throw error
}

export async function insertPilotLead(lead: {
  company_name: string
  contact_name: string
  work_email: string
  use_case: string
  launch_city: string
  estimated_locations: number
  timeline: string
}): Promise<{ id: string }> {
  const db = getServiceClient()
  const id = crypto.randomUUID()
  const { error } = await db.from('audit_events').insert({
    event_type: 'pilot_lead.created',
    actor_type: 'buyer',
    resource_type: 'pilot_lead',
    resource_id: id,
    metadata: lead,
  })
  if (error) throw error
  return { id }
}

// CAS transition: only updates if current status matches `from`
export async function transition(
  id: string,
  from: TaskStatus,
  to: TaskStatus,
  extra?: Partial<Pick<Task, 'result' | 'proof_payload' | 'resolved_at' | 'submitted_at'>>
): Promise<Task | null> {
  const db = getServiceClient()
  const update: Record<string, unknown> = { status: to, ...extra }
  const { data, error } = await db
    .from('tasks')
    .update(update)
    .eq('id', id)
    .eq('status', from)
    .select()
    .single()
  if (error) return null
  return data as Task
}

// Atomic claim via SQL function — no read-then-write race
export async function claimTask(
  taskId: string,
  workerWallet: string,
  claimExpiresAt: Date
): Promise<Task | null> {
  const db = getServiceClient()
  const { data, error } = await db.rpc('claim_task', {
    p_task_id: taskId,
    p_worker: workerWallet,
    p_expires_at: claimExpiresAt.toISOString(),
  })
  if (error || !data) return null
  return data as Task
}

export async function listOpenTasks(): Promise<Task[]> {
  const db = getServiceClient()
  const { data, error } = await db
    .from('tasks')
    .select()
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Task[]
}

// Returns false if payment_ref already exists (replay detected)
export async function recordPaymentRef(params: {
  payment_ref: string
  task_id: string
  amount_units: bigint
  fee_units: bigint
  payer_address: string
  tx_hash?: string
}): Promise<boolean> {
  const db = getServiceClient()
  const { error } = await db.from('payments').insert({
    payment_ref: params.payment_ref,
    task_id: params.task_id,
    amount_units: params.amount_units.toString(),
    fee_units: params.fee_units.toString(),
    payer_address: params.payer_address,
    tx_hash: params.tx_hash ?? null,
  })
  // 23505 = unique violation on either payment_ref (PK) or tx_hash (unique).
  // A replayed on-chain tx collides on tx_hash even with a fresh payment_ref.
  if (error?.code === '23505') return false
  if (error) throw error
  return true
}

/**
 * Overwrite a task's budget with the amount actually settled.
 *
 * The worker payout is derived from the task's budget, so leaving a
 * caller-supplied figure there would let someone request a large budget, pay a
 * small amount, and collect the difference out of the operator's wallet. The
 * facilitator's settled amount is the only trustworthy number.
 */
export async function setTaskBudget(id: string, budgetUsdt: string): Promise<void> {
  const db = getServiceClient()
  const { error } = await db.from('tasks').update({ budget_usdt: budgetUsdt }).eq('id', id)
  if (error) throw error
}

export interface PaymentRecord {
  tx_hash: string | null
  payer_address: string | null
  amount_units: string | null
}

/** The settlement recorded for a task, so callers can poll payment finality. */
export async function getPaymentByTaskId(taskId: string): Promise<PaymentRecord | null> {
  const db = getServiceClient()
  const { data, error } = await db
    .from('payments')
    .select('tx_hash,payer_address,amount_units')
    .eq('task_id', taskId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as PaymentRecord | null) ?? null
}

export async function recordProofHash(taskId: string, phash: string): Promise<void> {
  const db = getServiceClient()
  await db.from('proof_hashes').insert({ task_id: taskId, phash })
}

export async function recentProofHashes(limitMinutes = 60): Promise<string[]> {
  const db = getServiceClient()
  const since = new Date(Date.now() - limitMinutes * 60_000).toISOString()
  const { data } = await db
    .from('proof_hashes')
    .select('phash')
    .gt('created_at', since)
  return (data ?? []).map((r: { phash: string }) => r.phash)
}

export async function bumpWorker(params: {
  wallet: string
  earned_units: bigint
  outcome: 'completed' | 'failed'
}): Promise<void> {
  const db = getServiceClient()
  // Upsert worker row
  const { error: upsertErr } = await db.from('workers').upsert(
    { wallet: params.wallet, last_seen: new Date().toISOString() },
    { onConflict: 'wallet' }
  )
  if (upsertErr) throw upsertErr
  // Increment counters
  const col = params.outcome === 'completed' ? 'tasks_completed' : 'tasks_failed'
  await db.rpc('increment_worker', {
    p_wallet: params.wallet,
    p_col: col,
    p_earned: params.earned_units.toString(),
  }).throwOnError()
}

export interface WorkerRep {
  wallet: string
  tasks_completed: number
  tasks_failed: number
  earned_usdt: string
}

// Top human oracles by completed tasks — surfaces reputation on the board so
// the marketplace isn't "any wallet that uploads a JPEG" (Sybil-visibility).
export async function listTopWorkers(limit = 5): Promise<WorkerRep[]> {
  const db = getServiceClient()
  const { fromUnits } = await import('./money')
  const { data } = await db
    .from('workers')
    .select('wallet,tasks_completed,tasks_failed,total_earned_units')
    .order('tasks_completed', { ascending: false })
    .limit(limit)
  return (data ?? [])
    .filter((w: { tasks_completed: number }) => w.tasks_completed > 0)
    .map((w: { wallet: string; tasks_completed: number; tasks_failed: number; total_earned_units: string }) => ({
      wallet: w.wallet,
      tasks_completed: w.tasks_completed,
      tasks_failed: w.tasks_failed,
      earned_usdt: fromUnits(BigInt(w.total_earned_units ?? 0)),
    }))
}

export interface LedgerEntry {
  direction: 'in' | 'out'
  address: string          // payer (in) or worker (out)
  amount_usdt: string
  tx_hash: string | null
  explorer: string | null  // null for demo/off-chain rows
  at: string               // ISO timestamp
  intent: string | null
}

// Public settlement ledger: incoming x402 payments (agent → escrow) and
// outgoing payouts (escrow → worker), merged newest-first. Payouts are read
// from each task's stored result.settle (see settleTask).
export async function listTransactions(limit = 25): Promise<LedgerEntry[]> {
  const db = getServiceClient()
  const { explorerTx } = await import('./chain')
  const { fromUnits } = await import('./money')
  const isRealHash = (h: string | null | undefined): h is string =>
    !!h && /^0x[0-9a-fA-F]{64}$/.test(h)

  const [paymentsRes, tasksRes] = await Promise.all([
    db.from('payments').select('payer_address,amount_units,tx_hash,created_at,task_id').order('created_at', { ascending: false }).limit(limit),
    db.from('tasks').select('id,intent,result').eq('status', 'verified').order('resolved_at', { ascending: false }).limit(200),
  ])

  const tasks = (tasksRes.data ?? []) as { id: string; intent: string; result: TaskResult | null }[]
  const intentById = new Map(tasks.map(t => [t.id, t.intent]))

  const inflows: LedgerEntry[] = (paymentsRes.data ?? []).map((p: { payer_address: string; amount_units: string; tx_hash: string | null; created_at: string; task_id: string }) => ({
    direction: 'in' as const,
    address: p.payer_address,
    amount_usdt: fromUnits(BigInt(p.amount_units)),
    tx_hash: p.tx_hash,
    explorer: isRealHash(p.tx_hash) ? explorerTx(p.tx_hash) : null,
    at: p.created_at,
    intent: intentById.get(p.task_id) ?? null,
  }))

  const payouts: LedgerEntry[] = tasks
    .map(t => {
      // jsonb normally arrives parsed, but tolerate a stringified result too.
      let result: unknown = t.result
      if (typeof result === 'string') {
        try { result = JSON.parse(result) } catch { result = null }
      }
      const s = (result as { settle?: { worker?: string; payout_usdt?: string; tx_hash?: string | null; explorer?: string | null; settled_at?: string } } | null)?.settle
      if (!s?.worker) return null
      return {
        direction: 'out' as const,
        address: s.worker,
        amount_usdt: s.payout_usdt ?? '0',
        tx_hash: s.tx_hash ?? null,
        explorer: s.explorer ?? (isRealHash(s.tx_hash) ? explorerTx(s.tx_hash!) : null),
        at: s.settled_at ?? '',
        intent: t.intent,
      } as LedgerEntry
    })
    .filter((e): e is LedgerEntry => e !== null)

  return [...inflows, ...payouts]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, limit)
}

export async function pulseStats(): Promise<{
  total_tasks: number
  verified_tasks: number
  total_paid_usdt: string
  active_workers: number
}> {
  const db = getServiceClient()
  const [tasksRes, workersRes, paymentsRes] = await Promise.all([
    db.from('tasks').select('status'),
    db.from('workers').select('wallet', { count: 'exact', head: true }),
    db.from('payments').select('amount_units'),
  ])
  const tasks = tasksRes.data ?? []
  const verified = tasks.filter((t: { status: string }) => t.status === 'verified').length
  const totalUnits = (paymentsRes.data ?? []).reduce(
    (sum: bigint, p: { amount_units: string }) => sum + BigInt(p.amount_units),
    0n
  )
  const { fromUnits } = await import('./money')
  return {
    total_tasks: tasks.length,
    verified_tasks: verified,
    total_paid_usdt: fromUnits(totalUnits),
    active_workers: workersRes.count ?? 0,
  }
}

export async function getAdminOperationsOverview() {
  const db = getServiceClient()
  // Parallel reads keep the console fast; each read independently retries a
  // transient serverless egress/TLS failure.
  const [tasksRes, paymentsRes, campaignsRes, leadsRes, workersRes] = await Promise.all([
    withDbRetry(() => db.from('tasks').select('id,intent,status,budget_usdt,created_at,submitted_at,resolved_at,worker_wallet,payment_ref,result').order('created_at', { ascending: false }).limit(500)),
    withDbRetry(() => db.from('payments').select('amount_units')),
    withDbRetry(() => db.from('campaigns').select('*').order('created_at', { ascending: false }).limit(100)),
    withDbRetry(() => db.from('audit_events').select('*').eq('event_type', 'pilot_lead.created').order('created_at', { ascending: false }).limit(100)),
    withDbRetry(() => db.from('workers').select('wallet,tasks_completed,tasks_failed,total_earned_units,last_seen').order('last_seen', { ascending: false }).limit(250)),
  ])
  const warnings = [
    tasksRes.error ? 'tasks' : null,
    paymentsRes.error ? 'payments' : null,
    campaignsRes.error ? 'campaigns' : null,
    leadsRes.error ? 'leads' : null,
    workersRes.error ? 'workers' : null,
  ].filter((value): value is string => !!value)
  const tasks = (tasksRes.data ?? []) as Array<MetricTask & { id: string; intent: string; worker_wallet: string | null; payment_ref: string | null; campaign_id?: string | null }>
  const paymentVolume = (paymentsRes.data ?? []).reduce((sum, payment: { amount_units: string }) => sum + Number(payment.amount_units) / 1_000_000, 0)
  const taskCounts = new Map<string, Record<string, number>>()
  for (const task of tasks) {
    if (!task.campaign_id) continue
    const counts = taskCounts.get(task.campaign_id) ?? {}
    counts[task.status] = (counts[task.status] ?? 0) + 1
    taskCounts.set(task.campaign_id, counts)
  }
  return {
    generated_at: new Date().toISOString(),
    scope: 'prototype_and_pilot_activity',
    warnings,
    metrics: calculateOperationsMetrics(tasks, paymentVolume),
    settlement_exceptions: tasks.filter(task => task.status === 'verified' && !task.result?.settle).map(task => ({ id: task.id, intent: task.intent, worker_wallet: task.worker_wallet, budget_usdt: task.budget_usdt, resolved_at: task.resolved_at })),
    campaigns: (campaignsRes.data ?? []).map(campaign => ({ ...campaign, task_counts: taskCounts.get(campaign.id) ?? {} })),
    leads: (leadsRes.data ?? []).map(row => ({ id: row.resource_id, created_at: row.created_at, ...(row.metadata as object) })),
    workers: (workersRes.data ?? []).map(worker => {
      const completed = Number(worker.tasks_completed ?? 0)
      const failed = Number(worker.tasks_failed ?? 0)
      const attempts = completed + failed
      return { ...worker, success_rate_pct: attempts ? Number(((completed / attempts) * 100).toFixed(1)) : null }
    }),
  }
}

export async function controlCampaign(id: string, action: 'cancel' | 'complete'): Promise<{ changed: boolean; open_tasks: number }> {
  const db = getServiceClient()
  const { data: tasks, error: taskError } = await db.from('tasks').select('id,status').eq('campaign_id', id)
  if (taskError) throw taskError
  const open = (tasks ?? []).filter(task => ['pending', 'claimed', 'submitted', 'needs_review'].includes(task.status))
  if (action === 'complete' && open.length) return { changed: false, open_tasks: open.length }
  if (action === 'cancel') {
    await db.from('tasks').update({ status: 'expired', resolved_at: new Date().toISOString() }).eq('campaign_id', id).eq('status', 'pending').throwOnError()
  }
  const { error } = await db.from('campaigns').update({ status: action === 'cancel' ? 'cancelled' : 'completed' }).eq('id', id)
  if (error) throw error
  return { changed: true, open_tasks: open.length }
}
