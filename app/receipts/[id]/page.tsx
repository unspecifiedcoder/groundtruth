'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DEMO_TASKS } from '@/lib/demo-campaign'

type ReceiptData = {
  id: string
  intent: string
  status: string
  proof_spec?: { location?: { label?: string }; challenge?: string }
  proof_payload?: { formData?: Record<string, string>; evidenceUrls?: string[]; location?: { accuracy_meters?: number; capturedAt?: string; coordinates_redacted?: boolean } } | null
  result?: { notary?: { confidence?: number; reason?: string; checks?: { label: string; passed: boolean }[] }; checks?: { name: string; passed: boolean; detail?: string }[] } | null
  payment?: { status?: string; explorer?: string | null }
}

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const demo = DEMO_TASKS.find(task => task.id === params.id)
  const [data, setData] = useState<ReceiptData | null>(demo ? {
    id: demo.id,
    intent: `Verify ${demo.sku} availability, shelf price, promotion, and display at ${demo.store}`,
    status: demo.status,
    proof_spec: { location: { label: demo.store }, challenge: 'GT8K2Q' },
    proof_payload: { formData: { availability: demo.availability ?? 'Not recorded', shelf_price: demo.price ?? 'Not recorded', promotion: 'No active promotion', display_notes: 'Eye-level shelf; two facings' }, location: { accuracy_meters: 11, capturedAt: '2026-09-25T10:42:00.000Z', coordinates_redacted: true } },
    result: { notary: { confidence: demo.confidence ?? 0.98, reason: demo.status === 'failed' ? 'The submission was outside the permitted capture radius.' : 'The product, price label, and freshness challenge are visible.', checks: [{ label: 'Subject matches the task', passed: demo.status !== 'failed' }, { label: 'Freshness code is visible', passed: true }] }, checks: [{ name: 'target_location', passed: demo.status !== 'failed', detail: demo.status === 'failed' ? '1,800m from target; 150m permitted radius.' : `${demo.distance} from target; within 150m permitted radius.` }, { name: 'required_observations', passed: true, detail: '4 required observations supplied.' }] },
    payment: { status: demo.status === 'verified' ? 'confirmed' : 'none', explorer: null },
  } : null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (demo) return
    fetch(`/api/v1/tasks/${params.id}`, { cache: 'no-store' }).then(async response => {
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Receipt not found')
      setData(body)
    }).catch(err => setError(err instanceof Error ? err.message : 'Receipt not found'))
  }, [demo, params.id])

  if (error) return <main className="min-h-screen px-5 py-20 text-center"><h1 className="font-display text-3xl font-extrabold">Receipt unavailable</h1><p className="mt-2" style={{ color: 'var(--text-muted)' }}>{error}</p></main>
  if (!data) return <main className="min-h-screen flex items-center justify-center"><p className="font-mono text-sm">Loading receipt…</p></main>

  const passed = data.status === 'verified'
  const notaryChecks = data.result?.notary?.checks ?? []
  const integrityChecks = data.result?.checks ?? []
  const allChecks: Array<{ name: string; passed: boolean; detail?: string }> = [
    ...notaryChecks.map(check => ({ name: check.label, passed: check.passed })),
    ...integrityChecks,
  ]

  return (
    <main className="min-h-screen px-5 py-12" style={{ color: 'var(--text)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6"><Link href={demo ? '/campaigns/demo' : '/tasks'} className="text-sm" style={{ color: 'var(--text-muted)' }}>← Back</Link>{demo && <span className="chip text-[9px] px-2 py-1" style={{ background: 'var(--warn-weak)', color: 'var(--warn)' }}>Example receipt</span>}</div>
        <div className="ticket">
          <div className="ticket-head"><span>GroundTruth evidence receipt</span><span>{data.id.slice(0, 12)}</span></div>
          <div className="ticket-body sm:p-8">
            <div className="flex items-start justify-between gap-5 mb-7"><div><p className="chip text-[9px] mb-2" style={{ color: passed ? 'var(--good)' : 'var(--accent)' }}>{passed ? 'Verified field evidence' : 'Evidence rejected'}</p><h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">{data.intent}</h1></div><div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ background: passed ? 'var(--good-weak)' : 'var(--accent-weak)', color: passed ? 'var(--good)' : 'var(--accent)' }}>{passed ? '✓' : '×'}</div></div>

            {data.proof_spec?.location?.label && <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--info-weak)' }}><div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--info)' }}>Target site</div><div className="font-bold mt-1">{data.proof_spec.location.label}</div></div>}

            {!!data.proof_payload?.evidenceUrls?.length && <div className="grid sm:grid-cols-2 gap-3 mb-6">{data.proof_payload.evidenceUrls.map((url, index) => <img key={url} src={url} alt={`Submitted evidence ${index + 1}`} className="w-full rounded-xl object-cover aspect-[4/3]" />)}</div>}

            {data.proof_payload?.formData && <div className="grid sm:grid-cols-2 gap-3 mb-6">{Object.entries(data.proof_payload.formData).map(([label, value]) => <div key={label} className="rounded-xl p-4" style={{ background: 'var(--bg-subtle)' }}><div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label.replaceAll('_', ' ')}</div><div className="font-bold mt-1">{value}</div></div>)}</div>}

            <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}><h2 className="font-display text-lg font-extrabold mb-4">Verification checks</h2><div className="space-y-3">{allChecks.map((check, index) => <div key={`${check.name}-${index}`} className="flex gap-3"><span className="font-bold" style={{ color: check.passed ? 'var(--good)' : 'var(--accent)' }}>{check.passed ? '✓' : '×'}</span><div><div className="text-sm font-bold">{check.name.replaceAll('_', ' ')}</div>{check.detail && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{check.detail}</p>}</div></div>)}</div></div>

            <div className="grid sm:grid-cols-3 gap-3 mt-7 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <div><div className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-faint)' }}>AI confidence</div><div className="font-display text-xl font-extrabold mt-1">{data.result?.notary?.confidence != null ? `${Math.round(data.result.notary.confidence * 100)}%` : '—'}</div></div>
              <div><div className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-faint)' }}>Capture accuracy</div><div className="font-display text-xl font-extrabold mt-1">{data.proof_payload?.location?.accuracy_meters != null ? `±${Math.round(data.proof_payload.location.accuracy_meters)}m` : '—'}</div></div>
              <div><div className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-faint)' }}>Payment</div><div className="font-display text-xl font-extrabold mt-1 capitalize">{data.payment?.status ?? 'none'}</div></div>
            </div>

            {data.result?.notary?.reason && <p className="text-sm mt-6 p-4 rounded-xl" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>{data.result.notary.reason}</p>}
            <p className="font-mono text-[9px] mt-6 text-center" style={{ color: 'var(--text-faint)' }}>Exact worker coordinates are redacted from public receipts.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
