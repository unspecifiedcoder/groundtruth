'use client'

import { useCallback, useEffect, useState } from 'react'

type ReviewTask = { id: string; intent: string; worker_wallet: string; budget_usdt: string; submitted_at: string; evidence_urls?: string[]; proof_payload?: { formData?: Record<string, string> } }
type Metrics = { total_tasks: number; verified_tasks: number; failed_tasks: number; awaiting_review: number; in_field: number; acceptance_rate_pct: number | null; median_turnaround_minutes: number | null; payment_volume_usdt: number; worker_payouts_usdt: number; recorded_fees_usdt: number; recorded_fee_margin_pct: number | null; open_reward_liability_usdt: number; settlement_issues: number }
type Campaign = { id: string; name: string; customer_name: string; status: string; created_at: string; expires_at: string; task_counts: Record<string, number> }
type Lead = { id: string; company_name?: string; contact_name?: string; work_email?: string; use_case?: string; launch_city?: string; estimated_locations?: number; timeline?: string; created_at: string }
type Worker = { wallet: string; tasks_completed: number; tasks_failed: number; total_earned_units: string; last_seen: string; success_rate_pct: number | null }
type SettlementException = { id: string; intent: string; worker_wallet: string | null; budget_usdt: string; resolved_at: string | null }
type Overview = { generated_at: string; scope: string; warnings: string[]; metrics: Metrics; settlement_exceptions: SettlementException[]; campaigns: Campaign[]; leads: Lead[]; workers: Worker[] }
type Tab = 'overview' | 'review' | 'campaigns' | 'leads' | 'workers'

const metricLabels: Array<[keyof Metrics, string, string]> = [
  ['acceptance_rate_pct', 'Acceptance rate', '%'],
  ['median_turnaround_minutes', 'Median turnaround', ' min'],
  ['payment_volume_usdt', 'Test value processed', ' USDT'],
  ['recorded_fee_margin_pct', 'Recorded fee margin', '%'],
  ['open_reward_liability_usdt', 'Open reward exposure', ' USDT'],
  ['settlement_issues', 'Settlement exceptions', ''],
]

export default function AdminReviewClient() {
  const [secret, setSecret] = useState('')
  const [tasks, setTasks] = useState<ReviewTask[]>([])
  const [overview, setOverview] = useState<Overview | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')

  const load = useCallback(async () => {
    const [queueResponse, overviewResponse] = await Promise.all([
      fetch('/api/admin/queue', { cache: 'no-store' }),
      fetch('/api/admin/overview', { cache: 'no-store' }),
    ])
    if (queueResponse.status === 401 || overviewResponse.status === 401) { setAuthenticated(false); return }
    const [queueData, overviewData] = await Promise.all([queueResponse.json(), overviewResponse.json()])
    if (!queueResponse.ok) throw new Error(queueData.error ?? 'Could not load review queue')
    if (!overviewResponse.ok) throw new Error(overviewData.error ?? 'Could not load operations data')
    setAuthenticated(true)
    setTasks(queueData)
    setOverview(overviewData)
  }, [])

  useEffect(() => { load().catch(() => {}) }, [load])

  async function login() {
    setBusy(true); setError('')
    const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret }) })
    const data = await response.json()
    if (!response.ok) setError(data.error ?? 'Login failed')
    else { setSecret(''); await load() }
    setBusy(false)
  }

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' })
    setAuthenticated(false); setOverview(null); setTasks([])
  }

  async function decide(id: string, action: 'approve' | 'reject') {
    setBusy(true); setError('')
    const response = await fetch(`/api/admin/review/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    const data = await response.json()
    if (!response.ok) setError(data.error ?? 'Review failed'); else await load()
    setBusy(false)
  }

  async function controlCampaign(id: string, action: 'cancel' | 'complete') {
    if (action === 'cancel' && !window.confirm('Cancel this campaign and expire every still-open mission? Claimed or submitted obligations remain reviewable.')) return
    setBusy(true); setError('')
    const response = await fetch(`/api/admin/campaigns/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    const data = await response.json()
    if (!response.ok) setError(data.error ?? 'Campaign action failed'); else await load()
    setBusy(false)
  }

  async function retrySettlement(id: string) {
    if (!window.confirm('Retry this payout now? The settlement path is idempotent, but this may submit an on-chain transaction.')) return
    setBusy(true); setError('')
    const response = await fetch(`/api/admin/settlements/${id}/retry`, { method: 'POST' })
    const data = await response.json()
    if (!response.ok) setError(data.error ?? 'Settlement retry failed'); else await load()
    setBusy(false)
  }

  function exportLeads() {
    if (!overview?.leads.length) return
    const fields: Array<keyof Lead> = ['created_at', 'company_name', 'contact_name', 'work_email', 'launch_city', 'estimated_locations', 'timeline', 'use_case']
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const csv = [fields.join(','), ...overview.leads.map(lead => fields.map(field => escape(lead[field])).join(','))].join('\n')
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'groundtruth-pilot-leads.csv'; link.click(); URL.revokeObjectURL(link.href)
  }

  if (!authenticated) return <main className="min-h-[75vh] px-5 flex items-center justify-center"><div className="card p-7 w-full max-w-md"><p className="chip text-[10px] mb-3" style={{ color: 'var(--warn)' }}>Restricted operations</p><h1 className="font-display text-3xl font-extrabold mb-3">Operator sign-in</h1><p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Exchange the operations key for a secure, time-limited session.</p><input type="password" value={secret} onChange={event => setSecret(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') login() }} className="w-full rounded-xl px-4 py-3 mb-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }} placeholder="Operations key" />{error && <p className="text-sm mb-3" style={{ color: 'var(--accent)' }}>{error}</p>}<button onClick={login} disabled={busy || !secret} className="btn btn-primary w-full py-3 disabled:opacity-40">{busy ? 'Signing in…' : 'Open operations console'}</button></div></main>

  const tabs: Array<[Tab, string, number | null]> = [['overview', 'Overview', null], ['review', 'Review', tasks.length], ['campaigns', 'Campaigns', overview?.campaigns.length ?? 0], ['leads', 'Pilot leads', overview?.leads.length ?? 0], ['workers', 'Workers', overview?.workers.length ?? 0]]
  return <main className="min-h-screen p-5"><div className="max-w-6xl mx-auto"><header className="flex flex-col sm:flex-row justify-between gap-4 mb-6"><div><p className="chip text-[10px] mb-2" style={{ color: 'var(--warn)' }}>Private operations</p><h1 className="font-display text-3xl font-extrabold">GroundTruth control room</h1><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Prototype and pilot telemetry—never presented as customer traction.</p></div><div className="flex gap-2"><button className="btn btn-ghost px-4 py-2 text-sm" onClick={() => load()}>Refresh</button><button className="btn btn-ghost px-4 py-2 text-sm" onClick={logout}>Sign out</button></div></header>
    <nav className="flex gap-2 overflow-x-auto pb-3 mb-5">{tabs.map(([value, label, count]) => <button key={value} onClick={() => setTab(value)} className="btn px-4 py-2 text-sm whitespace-nowrap" style={{ background: tab === value ? 'var(--accent)' : 'var(--bg-subtle)', color: tab === value ? 'white' : 'var(--text-muted)' }}>{label}{count !== null ? ` · ${count}` : ''}</button>)}</nav>
    {error && <p className="rounded-xl p-4 mb-5" style={{ color: 'var(--accent)', background: 'var(--warn-weak)' }}>{error}</p>}
    {!!overview?.warnings.length && <p className="rounded-xl p-4 mb-5 text-sm" style={{ color: 'var(--warn)', background: 'var(--warn-weak)' }}>Some telemetry is temporarily unavailable: {overview.warnings.join(', ')}. Refresh to retry.</p>}
    {tab === 'overview' && overview && <section><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{metricLabels.map(([key, label, suffix]) => <div key={key} className="card p-5"><div className="font-display text-3xl font-extrabold">{overview.metrics[key] ?? '—'}{overview.metrics[key] !== null ? suffix : ''}</div><div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div></div>)}</div><div className="card p-5 mt-5"><h2 className="font-display text-lg font-bold mb-3">Operational state</h2><div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">{[['Total', overview.metrics.total_tasks], ['Verified', overview.metrics.verified_tasks], ['Failed', overview.metrics.failed_tasks], ['In field', overview.metrics.in_field], ['Review', overview.metrics.awaiting_review]].map(([label, value]) => <div key={label} className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}><strong className="text-xl">{value}</strong><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div></div>)}</div></div>{overview.settlement_exceptions.length > 0 && <div className="card p-5 mt-5"><h2 className="font-display text-lg font-bold">Settlement exceptions</h2><p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>Verified work without a recorded payout. Retry is idempotent and audited.</p><div className="space-y-3">{overview.settlement_exceptions.map(item => <div key={item.id} className="rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-3" style={{ background: 'var(--warn-weak)' }}><div><strong>{item.intent}</strong><p className="text-xs font-mono mt-1">{item.worker_wallet?.slice(0, 10)}… · {item.budget_usdt} USDT</p></div><button disabled={busy} onClick={() => retrySettlement(item.id)} className="btn btn-ghost px-4 py-2 text-sm">Retry payout</button></div>)}</div></div>}</section>}
    {tab === 'review' && <section>{tasks.length === 0 ? <Empty text="No submissions awaiting review." /> : <div className="space-y-5">{tasks.map(task => <article key={task.id} className="card p-6"><div className="flex flex-col sm:flex-row justify-between gap-4"><div><h2 className="font-display text-xl font-bold">{task.intent}</h2><p className="font-mono text-xs mt-2" style={{ color: 'var(--text-faint)' }}>Worker {task.worker_wallet?.slice(0, 8)}… · {new Date(task.submitted_at).toLocaleString()}</p></div><strong style={{ color: 'var(--good)' }}>${task.budget_usdt} USDT</strong></div>{!!task.evidence_urls?.length && <div className="grid sm:grid-cols-3 gap-3 mt-5">{task.evidence_urls.map((url, index) => <img key={url} src={url} alt={`Evidence ${index + 1}`} className="w-full aspect-[4/3] object-cover rounded-xl" />)}</div>}{task.proof_payload?.formData && <div className="grid sm:grid-cols-2 gap-3 mt-5">{Object.entries(task.proof_payload.formData).map(([key, value]) => <div key={key} className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}><span className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-faint)' }}>{key.replaceAll('_', ' ')}</span><div className="font-bold mt-1">{value}</div></div>)}</div>}<div className="flex gap-3 mt-6"><button disabled={busy} onClick={() => decide(task.id, 'approve')} className="btn px-5 py-2.5 disabled:opacity-40" style={{ background: 'var(--good)', color: 'white' }}>Approve & pay</button><button disabled={busy} onClick={() => decide(task.id, 'reject')} className="btn btn-ghost px-5 py-2.5 disabled:opacity-40">Reject</button></div></article>)}</div>}</section>}
    {tab === 'campaigns' && overview && <section>{overview.campaigns.length === 0 ? <Empty text="No live campaigns yet." /> : <div className="space-y-3">{overview.campaigns.map(campaign => <article key={campaign.id} className="card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="font-display text-lg font-bold">{campaign.name}</h2><span className="chip text-[9px]">{campaign.status}</span></div><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{campaign.customer_name} · {Object.entries(campaign.task_counts).map(([status, count]) => `${count} ${status}`).join(' · ') || 'No tasks'}</p></div>{campaign.status === 'active' && <div className="flex gap-2"><button disabled={busy} className="btn btn-ghost px-4 py-2 text-sm" onClick={() => controlCampaign(campaign.id, 'complete')}>Complete</button><button disabled={busy} className="btn px-4 py-2 text-sm" style={{ background: 'var(--accent-weak)', color: 'var(--accent)' }} onClick={() => controlCampaign(campaign.id, 'cancel')}>Cancel open work</button></div>}</article>)}</div>}</section>}
    {tab === 'leads' && overview && <section><div className="flex justify-end mb-3"><button className="btn btn-ghost px-4 py-2 text-sm" onClick={exportLeads}>Export CSV</button></div>{overview.leads.length === 0 ? <Empty text="No pilot applications yet." /> : <div className="space-y-3">{overview.leads.map(lead => <article key={lead.id} className="card p-5"><div className="flex flex-col sm:flex-row justify-between gap-3"><div><h2 className="font-display text-lg font-bold">{lead.company_name ?? 'Unknown company'}</h2><p className="text-sm" style={{ color: 'var(--text-muted)' }}>{lead.contact_name} · <a className="underline" href={`mailto:${lead.work_email}`}>{lead.work_email}</a></p></div><span className="text-sm">{lead.estimated_locations ?? '—'} locations · {lead.launch_city}</span></div><p className="mt-3 text-sm">{lead.use_case}</p></article>)}</div>}</section>}
    {tab === 'workers' && overview && <section>{overview.workers.length === 0 ? <Empty text="No worker history yet." /> : <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ color: 'var(--text-muted)' }}><th className="text-left p-4">Wallet</th><th className="text-right p-4">Completed</th><th className="text-right p-4">Failed</th><th className="text-right p-4">Success</th><th className="text-right p-4">Last seen</th></tr></thead><tbody>{overview.workers.map(worker => <tr key={worker.wallet} style={{ borderTop: '1px solid var(--border)' }}><td className="p-4 font-mono">{worker.wallet.slice(0, 8)}…{worker.wallet.slice(-6)}</td><td className="p-4 text-right">{worker.tasks_completed}</td><td className="p-4 text-right">{worker.tasks_failed}</td><td className="p-4 text-right">{worker.success_rate_pct === null ? 'New' : `${worker.success_rate_pct}%`}</td><td className="p-4 text-right">{new Date(worker.last_seen).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</section>}
  </div></main>
}

function Empty({ text }: { text: string }) { return <div className="card p-14 text-center"><div className="text-4xl mb-3">✓</div><p>{text}</p></div> }
