'use client'

import { FormEvent, useState } from 'react'

const DEMO_TASK_ID = '00000000-0000-4000-8000-000000042161'

type Receipt = {
  exists: boolean
  taskKey: string
  contract: string
  chainId: number
  network?: string
  explorer: string
  evidenceRoot?: string
  proofSpecHash?: string
  verdictHash?: string
  capturedAt?: number
  recordedAt?: number
}

export default function ReceiptVerifier() {
  const [taskId, setTaskId] = useState(DEMO_TASK_ID)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function verify(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setReceipt(null)
    try {
      const response = await fetch(`/api/v1/receipts/${encodeURIComponent(taskId.trim())}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Lookup failed')
      setReceipt(body)
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={verify} className="card p-5 sm:p-6">
        <label className="block font-display font-bold mb-2" htmlFor="task-id">GroundTruth task ID</label>
        <p className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>A protocol-demo receipt is prefilled so you can verify the deployed registry without creating a paid task. It is testnet evidence, not customer traction.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input id="task-id" required value={taskId} onChange={event => setTaskId(event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className="flex-1 rounded-xl border px-4 py-3 font-mono text-sm" style={{ background: 'var(--bg)', borderColor: 'var(--border-strong)', color: 'var(--text)' }} />
          <button disabled={loading} className="btn btn-primary px-6 py-3 disabled:opacity-50">{loading ? 'Checking…' : 'Verify receipt'}</button>
        </div>
      </form>
      {error && <p className="rounded-xl p-4 mt-4" style={{ background: 'var(--warn-weak)' }}>{error}</p>}
      {receipt && <section className="card p-6 mt-5">
        <div className="flex items-center justify-between gap-3"><h2 className="font-display text-2xl font-extrabold">{receipt.exists ? 'Receipt found' : 'No receipt recorded'}</h2><span className="chip text-[9px]" style={{ color: receipt.exists ? 'var(--good)' : 'var(--warn)' }}>{receipt.network ?? `chain ${receipt.chainId}`}</span></div>
        <dl className="mt-5 space-y-4 text-sm">
          {[['Task key', receipt.taskKey], ['Evidence root', receipt.evidenceRoot], ['Proof-spec hash', receipt.proofSpecHash], ['Verdict hash', receipt.verdictHash]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="font-mono break-all mt-1" style={{ color: 'var(--text-muted)' }}>{value}</dd></div>)}
        </dl>
        <a className="btn btn-ghost px-5 py-2.5 mt-6" href={receipt.explorer} target="_blank" rel="noreferrer">Inspect registry on explorer →</a>
      </section>}
    </div>
  )
}
