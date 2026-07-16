'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Task {
  id: string
  intent: string
  proof_spec: {
    type: 'photo' | 'form'
    instructions: string
    minPhotos?: number
    formFields?: string[]
  }
  budget_usdt: string
  status: string
  expires_at: string
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<'loading' | 'view' | 'claimed' | 'submitted' | 'error'>('loading')
  const [wallet, setWallet] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  // Fetch task on mount
  useState(() => {
    fetch(`/api/v1/tasks/${params.id}`)
      .then(r => r.json())
      .then(t => { setTask(t); setPhase('view') })
      .catch(() => setPhase('error'))
  })

  async function handleClaim() {
    if (!wallet.match(/^0x[0-9a-fA-F]{40}$/)) {
      setError('Enter a valid wallet address')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/tasks/${params.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_wallet: wallet }),
      })
      if (!res.ok) { setError('Failed to claim — task may already be taken'); return }
      setPhase('claimed')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!task) return
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('task_id', task.id)
      fd.append('worker_wallet', wallet)
      fd.append('proof_type', task.proof_spec.type)

      if (task.proof_spec.type === 'photo') {
        for (const f of files) fd.append('photos', f)
      } else {
        fd.append('form_data', JSON.stringify(formData))
      }

      const res = await fetch(`/api/tasks/${params.id}/submit`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) { setError('Submission failed'); return }
      setPhase('submitted')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (phase === 'loading') return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>
  if (phase === 'error' || !task) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Task not found</div>
  if (phase === 'submitted') return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-bold mb-2">Proof submitted!</h2>
      <p className="text-gray-400 mb-6">Verification in progress. Payment sent to {wallet.slice(0, 6)}…{wallet.slice(-4)} once confirmed.</p>
      <button onClick={() => router.push('/tasks')} className="bg-green-500 text-black font-semibold px-6 py-3 rounded-xl">Find more tasks</button>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <div className="text-green-400 font-bold text-2xl mb-1">${task.budget_usdt} USDT</div>
          <h1 className="text-xl font-semibold">{task.intent}</h1>
          <p className="mt-2 text-gray-300 text-sm">{task.proof_spec.instructions}</p>
          <p className="text-xs text-gray-500 mt-1">Expires {new Date(task.expires_at).toLocaleString()}</p>
        </div>

        {phase === 'view' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Your wallet address (to receive payment)</label>
              <input
                type="text"
                placeholder="0x..."
                value={wallet}
                onChange={e => setWallet(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm font-mono"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Claiming...' : 'Claim this task'}
            </button>
          </div>
        )}

        {phase === 'claimed' && (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-700 rounded-xl p-4">
              <p className="text-green-400 font-medium text-sm">✓ Task claimed! Complete it before the timer runs out.</p>
            </div>

            {task.proof_spec.type === 'photo' ? (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Upload {task.proof_spec.minPhotos ?? 1}+ photo(s)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={e => setFiles(Array.from(e.target.files ?? []))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm"
                />
                {files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.map((f: File, i: number) => (
                      <div key={i} className="text-xs bg-gray-800 px-2 py-1 rounded-lg text-gray-300">
                        {f.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {(task.proof_spec.formFields ?? []).map((field: string) => (
                  <div key={field}>
                    <label className="block text-sm text-gray-400 mb-1 capitalize">{field}</label>
                    <input
                      type="text"
                      value={formData[field] ?? ''}
                      onChange={e => setFormData((prev: Record<string, string>) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm"
                      placeholder={`Enter ${field}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading || (task.proof_spec.type === 'photo' && files.length === 0)}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit proof →'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
