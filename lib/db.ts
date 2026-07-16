import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Task, TaskStatus, TaskResult, ProofPayload } from './types'

// Service-role client — used server-side only, never exposed to browser
function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
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
  if (error?.code === '23505') return false  // unique violation = replay
  if (error) throw error
  return true
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
