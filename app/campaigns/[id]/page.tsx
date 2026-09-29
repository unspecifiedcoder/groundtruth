'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { DEMO_CAMPAIGN, DEMO_TASKS } from '@/lib/demo-campaign'

type CampaignTask = {
  id: string
  intent?: string
  store?: string
  location?: string | null
  sku?: string | null
  status: string
  budget_usdt?: string
  price?: string | null
  availability?: string | null
  distance?: string | null
  confidence?: number | null
  promotion?: string | null
  answers?: Record<string, string> | null
  receipt_url?: string
}

type CampaignData = {
  campaign: typeof DEMO_CAMPAIGN
  tasks: CampaignTask[]
  counts?: Record<string, number>
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  verified: { label: 'Verified', color: 'var(--good)', bg: 'var(--good-weak)' },
  submitted: { label: 'Review', color: 'var(--warn)', bg: 'var(--warn-weak)' },
  claimed: { label: 'In field', color: 'var(--info)', bg: 'var(--info-weak)' },
  pending: { label: 'Open', color: 'var(--text-muted)', bg: 'var(--bg-subtle)' },
  failed: { label: 'Rejected', color: 'var(--accent)', bg: 'var(--accent-weak)' },
  expired: { label: 'Expired', color: 'var(--text-faint)', bg: 'var(--bg-subtle)' },
}

export default function CampaignDashboard() {
  const { id } = useParams<{ id: string }>()
  const isDemo = id === 'demo'
  const [data, setData] = useState<CampaignData | null>(isDemo ? { campaign: DEMO_CAMPAIGN, tasks: DEMO_TASKS } : null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isDemo) return
    async function loadCampaign() {
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const legacyQuery = new URLSearchParams(window.location.search)
      const token = fragment.get('key') ?? legacyQuery.get('key') ?? ''
      if (token) {
        const session = await fetch(`/api/campaigns/${id}/session`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
        })
        if (!session.ok) throw new Error('Invalid campaign access token')
        window.history.replaceState(null, '', `/campaigns/${id}`)
      }
      const response = await fetch(`/api/campaigns/${id}`, { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Could not load campaign')
      setData(body)
    }
    loadCampaign()
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load campaign'))
  }, [isDemo, id])

  const metrics = useMemo(() => {
    const tasks = data?.tasks ?? []
    const verified = tasks.filter(task => task.status === 'verified').length
    const active = tasks.filter(task => ['pending', 'claimed', 'submitted'].includes(task.status)).length
    const rejected = tasks.filter(task => task.status === 'failed').length
    const completion = tasks.length ? Math.round((verified / tasks.length) * 100) : 0
    return { total: tasks.length, verified, active, rejected, completion }
  }, [data])

  const findings = useMemo(() => {
    const tasks = data?.tasks ?? []
    const verified = tasks.filter(task => task.status === 'verified')
    const prices = verified
      .map(task => Number(String(task.price ?? task.answers?.shelf_price ?? '').replace(/[^0-9.]/g, '')))
      .filter(price => Number.isFinite(price) && price > 0)
    const lowStock = verified.filter(task => /low stock|out of stock/i.test(task.availability ?? task.answers?.availability ?? ''))
    const rejected = tasks.filter(task => task.status === 'failed')
    const unresolved = tasks.filter(task => ['pending', 'claimed', 'submitted'].includes(task.status))
    return {
      lowStock,
      rejected,
      unresolved,
      priceMin: prices.length ? Math.min(...prices) : null,
      priceMax: prices.length ? Math.max(...prices) : null,
    }
  }, [data])

  function issueFor(task: CampaignTask) {
    if (task.status === 'failed') return 'Evidence rejected; reassign and recollect'
    const availability = task.availability ?? task.answers?.availability ?? ''
    if (/out of stock/i.test(availability)) return 'Out of stock; investigate replenishment'
    if (/low stock/i.test(availability)) return 'Low stock; confirm replenishment timing'
    if (['pending', 'claimed', 'submitted'].includes(task.status)) return 'Result not yet accepted'
    return 'No exception in accepted evidence'
  }

  function exportResults() {
    if (!data) return
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const lines = [
      ['task_id', 'store', 'sku', 'status', 'availability', 'shelf_price', 'action_required', 'reward_usdt'].join(','),
      ...data.tasks.map(task => [
        task.id,
        task.store ?? task.location ?? task.intent ?? '',
        task.sku ?? '',
        task.status,
        task.availability ?? task.answers?.availability ?? '',
        task.price ?? task.answers?.shelf_price ?? '',
        issueFor(task),
        task.budget_usdt ?? data.campaign.budget_per_task_usdt,
      ].map(escape).join(',')),
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${data.campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-results.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (error) return <main className="min-h-screen px-5 py-20 text-center"><h1 className="font-display text-3xl font-extrabold mb-3">Campaign unavailable</h1><p style={{ color: 'var(--text-muted)' }}>{error}</p></main>
  if (!data) return <main className="min-h-screen flex items-center justify-center"><p className="font-mono text-sm" style={{ color: 'var(--text-faint)' }}>Loading campaign…</p></main>

  return (
    <main className="min-h-screen px-5 py-10" style={{ color: 'var(--text)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-9">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="chip text-[10px]" style={{ color: 'var(--good)' }}>Campaign control room</span>
              {isDemo && <span className="chip text-[9px] px-2 py-1" style={{ background: 'var(--warn-weak)', color: 'var(--warn)' }}>Demo dataset</span>}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold">{data.campaign.name}</h1>
            <p className="mt-2 max-w-2xl" style={{ color: 'var(--text-muted)' }}>{data.campaign.brief}</p>
            <p className="font-mono text-xs mt-3" style={{ color: 'var(--text-faint)' }}>{data.campaign.customer_name} · ${data.campaign.budget_per_task_usdt} worker reward per accepted store</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={exportResults} className="btn btn-ghost px-5 py-2.5 text-sm">Export CSV</button>
            <Link href="/tasks" className="btn btn-ghost px-5 py-2.5 text-sm">Mission board</Link>
            <Link href="/campaigns/new" className="btn btn-primary px-5 py-2.5 text-sm">New campaign →</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {[
            [metrics.total, 'Total stores', 'var(--text)'],
            [metrics.verified, 'Verified', 'var(--good)'],
            [metrics.active, 'In progress', 'var(--info)'],
            [metrics.rejected, 'Rejected', 'var(--accent)'],
            [`${metrics.completion}%`, 'Complete', 'var(--warn)'],
          ].map(([value, label, color]) => (
            <div key={String(label)} className="card p-5"><div className="font-display text-3xl font-extrabold" style={{ color: String(color) }}>{value}</div><div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div></div>
          ))}
        </div>

        <div className="card p-5 mb-8">
          <div className="flex justify-between text-xs mb-2"><span>Campaign completion</span><strong>{metrics.verified} of {metrics.total} verified</strong></div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}><div className="h-full rounded-full" style={{ width: `${metrics.completion}%`, background: 'var(--good)' }} /></div>
        </div>

        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"><div><span className="chip text-[9px]" style={{ color: 'var(--accent)' }}>Discrepancy-first summary</span><h2 className="font-display text-2xl font-extrabold mt-3">What needs action—not another photo folder</h2></div>{isDemo && <span className="text-xs max-w-xs" style={{ color: 'var(--text-faint)' }}>Illustrative calculations from the synthetic rows below. Not customer results.</span>}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            <FindingCard value={findings.lowStock.length} label="Accepted stock risks" detail={findings.lowStock.length ? findings.lowStock.map(task => task.store ?? task.location ?? 'Store').join(', ') : 'No accepted low/out-of-stock rows'} tone="var(--accent)" />
            <FindingCard value={findings.priceMin === null ? '—' : `₹${findings.priceMin}–₹${findings.priceMax}`} label="Accepted price range" detail={findings.priceMin === null ? 'No accepted shelf prices yet' : `₹${(findings.priceMax! - findings.priceMin).toFixed(0)} observed spread`} tone="var(--warn)" />
            <FindingCard value={findings.rejected.length} label="Evidence retries" detail={findings.rejected.length ? 'Rejected rows need recollection before buyer acceptance' : 'No rejected evidence'} tone="var(--warn)" />
            <FindingCard value={findings.unresolved.length} label="Still unresolved" detail="Open, in-field, or awaiting review—not counted as verified" tone="var(--info)" />
          </div>
          <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--bg-subtle)' }}><h3 className="font-display font-bold">Suggested operating actions</h3><ul className="mt-2 space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>{findings.lowStock.length > 0 && <li>• Ask the distributor or store owner for replenishment timing at {findings.lowStock.map(task => task.store ?? task.location ?? 'the flagged store').join(', ')}.</li>}{findings.rejected.length > 0 && <li>• Reassign {findings.rejected.length} rejected check{findings.rejected.length === 1 ? '' : 's'}; do not use failed evidence in the buyer decision.</li>}{findings.unresolved.length > 0 && <li>• Wait for or escalate {findings.unresolved.length} unresolved check{findings.unresolved.length === 1 ? '' : 's'} before treating the batch as complete.</li>}{findings.priceMin !== null && findings.priceMax !== null && findings.priceMax > findings.priceMin && <li>• Review the ₹{(findings.priceMax - findings.priceMin).toFixed(0)} shelf-price spread against the agreed price policy.</li>}</ul></div>
          {isDemo && <Link href="/pilot?utm_source=sample_report&utm_campaign=retail_launch_2026q3&utm_content=demo_campaign" className="btn btn-primary inline-flex px-5 py-2.5 text-sm mt-5">Scope this report for my stores →</Link>}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}><h2 className="font-display text-xl font-extrabold">Store evidence</h2><span className="font-mono text-[10px]" style={{ color: 'var(--text-faint)' }}>{isDemo ? 'ILLUSTRATIVE WORKFLOW' : 'LIVE WORKFLOW'}</span></div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {data.tasks.map(task => {
              const style = STATUS_STYLE[task.status] ?? STATUS_STYLE.pending
              const store = task.store ?? task.location ?? task.intent ?? 'Store task'
              const price = task.price ?? task.answers?.shelf_price
              const availability = task.availability ?? task.answers?.availability
              const receipt = isDemo ? `/receipts/${task.id}` : task.receipt_url ?? `/receipts/${task.id}`
              return (
                <div key={task.id} className="grid sm:grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-4">
                  <div className="min-w-0"><div className="font-display font-bold truncate">{store}</div><div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{task.sku}{task.distance ? ` · ${task.distance} from target` : ''}</div></div>
                  <div className="sm:text-right"><div className="text-sm font-bold">{availability ?? '—'}{price ? ` · ${price}` : ''}</div>{task.confidence != null && <div className="font-mono text-[10px]" style={{ color: 'var(--text-faint)' }}>Model match score {Math.round(task.confidence * 100)}/100 · not a truth guarantee</div>}</div>
                  <div className="flex items-center justify-between sm:justify-end gap-3"><span className="chip text-[9px] px-2 py-1" style={{ color: style.color, background: style.bg }}>{style.label}</span>{['verified', 'failed', 'submitted'].includes(task.status) && <Link href={receipt} className="text-xs font-bold" style={{ color: 'var(--info)' }}>Receipt →</Link>}</div>
                </div>
              )
            })}
          </div>
        </div>

        {isDemo && <div className="mt-6 rounded-xl p-4 text-sm" style={{ background: 'var(--warn-weak)', color: 'var(--text-muted)' }}><strong style={{ color: 'var(--warn)' }}>Illustrative output contract:</strong> this dataset shows the proposed deliverable format. It is not customer work, paid traction, or evidence of current coverage. Live campaigns use persisted tasks, original evidence submissions, location checks, and payment settlement.</div>}
      </div>
    </main>
  )
}

function FindingCard({ value, label, detail, tone }: { value: string | number; label: string; detail: string; tone: string }) {
  return <div className="rounded-xl p-4" style={{ background: 'var(--bg-subtle)' }}><strong className="font-display text-2xl" style={{ color: tone }}>{value}</strong><h3 className="text-sm font-bold mt-1">{label}</h3><p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-faint)' }}>{detail}</p></div>
}
