'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const VERIFY_STEPS = [
  { label: 'Uploading proof to GroundTruth...', duration: 600 },
  { label: 'Extracting image metadata...', duration: 700 },
  { label: 'Running AI vision analysis...', duration: 900 },
  { label: 'Checking against task requirements...', duration: 600 },
  { label: 'Confirmed ✓', duration: 400 },
]

function VerifyingScreen() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    let i = 0
    function next() {
      i++
      if (i < VERIFY_STEPS.length) {
        setStep(i)
        setTimeout(next, VERIFY_STEPS[i].duration)
      }
    }
    setTimeout(next, VERIFY_STEPS[0].duration)
  }, [])

  const current = VERIFY_STEPS[step]
  const confirmed = step === VERIFY_STEPS.length - 1

  return (
    <div className="min-h-screen bg-[#080c10] flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
          confirmed
            ? 'bg-[#00ff88]/15 border-2 border-[#00ff88] scale-110'
            : 'bg-white/5 border border-white/10'
        }`}>
          {confirmed
            ? <span className="text-4xl">✅</span>
            : <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
          }
        </div>

        <h2 className={`text-xl font-bold mb-6 transition-colors duration-300 ${confirmed ? 'text-[#00ff88]' : 'text-white'}`}>
          {current.label}
        </h2>

        <div className="space-y-2">
          {VERIFY_STEPS.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 ${
              i < step ? 'opacity-40' : i === step ? 'bg-white/5' : 'opacity-20'
            }`}>
              <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
                i < step
                  ? 'bg-[#00ff88] text-black'
                  : i === step && !confirmed
                  ? 'border border-[#00ff88] bg-transparent'
                  : i === step && confirmed
                  ? 'bg-[#00ff88] text-black'
                  : 'border border-white/20 bg-transparent'
              }`}>
                {i < step || (i === step && confirmed) ? '✓' : ''}
              </div>
              <span className="text-sm text-left text-gray-300">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

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
  const [phase, setPhase] = useState<'loading' | 'view' | 'claimed' | 'verifying' | 'submitted' | 'error'>('loading')
  const [loading, setLoading] = useState(false)
  const [wallet, setWallet] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/v1/tasks/${params.id}`)
      .then(r => r.json())
      .then(t => { setTask(t); setPhase('view') })
      .catch(() => setPhase('error'))
  }, [params.id])

  async function handleClaim() {
    if (!wallet.match(/^0x[0-9a-fA-F]{40}$/)) {
      setError('Enter a valid 0x wallet address')
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
      // Show verification animation before final screen
      setPhase('verifying')
      await new Promise(r => setTimeout(r, 3200))
      setPhase('submitted')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (phase === 'loading') return (
    <div className="min-h-screen bg-[#080c10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading task...</p>
      </div>
    </div>
  )

  if (phase === 'error' || !task) return (
    <div className="min-h-screen bg-[#080c10] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-gray-400">Task not found</p>
        <button onClick={() => router.push('/tasks')} className="mt-4 text-sm text-[#00ff88] hover:underline">
          ← Back to tasks
        </button>
      </div>
    </div>
  )

  if (phase === 'verifying') return (
    <VerifyingScreen />
  )

  if (phase === 'submitted') return (
    <div className="min-h-screen bg-[#080c10] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <div className="w-20 h-20 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-black mb-2">Proof submitted!</h2>
        <p className="text-gray-400 mb-2">Your submission is being verified by AI.</p>
        <p className="text-sm text-gray-500 mb-8">
          Payment of <span className="text-[#00ff88] font-bold">${task.budget_usdt} USDT</span> will be sent to{' '}
          <span className="font-mono text-xs">{wallet.slice(0, 6)}…{wallet.slice(-4)}</span> once confirmed.
        </p>
        <button
          onClick={() => router.push('/tasks')}
          className="w-full bg-[#00ff88] hover:bg-[#00e87a] text-black font-bold py-3 rounded-xl transition-colors"
        >
          Find more tasks →
        </button>
      </div>
    </div>
  )

  const isPhoto = task.proof_spec.type === 'photo'
  const expiresAt = new Date(task.expires_at)

  return (
    <main className="min-h-screen bg-[#080c10] text-white pb-16">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Back */}
        <button
          onClick={() => router.push('/tasks')}
          className="text-gray-500 hover:text-gray-300 text-sm mb-6 flex items-center gap-1 transition-colors"
        >
          ← All tasks
        </button>

        {/* Task header */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium border ${
              isPhoto
                ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20'
                : 'bg-blue-400/10 text-blue-400 border-blue-400/20'
            }`}>
              {isPhoto ? '📷 Photo proof' : '📋 Form proof'}
            </span>
            <div className="text-right">
              <div className="text-3xl font-black text-[#00ff88]">${task.budget_usdt}</div>
              <div className="text-xs text-gray-500">USDT reward</div>
            </div>
          </div>
          <h1 className="text-xl font-bold mb-3">{task.intent}</h1>
          <p className="text-gray-400 text-sm leading-relaxed">{task.proof_spec.instructions}</p>
          <p className="text-xs text-gray-600 mt-3">
            Expires {expiresAt.toLocaleString()}
          </p>
        </div>

        {/* Claim phase */}
        {phase === 'view' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your wallet address (to receive payment)
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={wallet}
                onChange={e => setWallet(e.target.value)}
                className="w-full bg-white/3 border border-white/10 focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/20 rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-[#00ff88] hover:bg-[#00e87a] disabled:opacity-40 text-black font-bold py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Claiming...
                </span>
              ) : 'Claim this task →'}
            </button>
            <p className="text-xs text-gray-600 text-center">
              Once claimed, complete it before the timer expires
            </p>
          </div>
        )}

        {/* Claimed phase */}
        {phase === 'claimed' && (
          <div className="space-y-5">
            <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-xl p-4">
              <p className="text-[#00ff88] font-semibold text-sm">✓ Task claimed! Submit your proof before it expires.</p>
            </div>

            {isPhoto ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload {task.proof_spec.minPhotos ?? 1}+ photo(s)
                </label>
                <label className="block w-full border-2 border-dashed border-white/15 hover:border-[#00ff88]/40 rounded-xl p-8 text-center cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={e => setFiles(Array.from(e.target.files ?? []))}
                    className="hidden"
                  />
                  {files.length === 0 ? (
                    <>
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📸</div>
                      <p className="text-gray-400 text-sm">Tap to take photo or upload</p>
                      <p className="text-gray-600 text-xs mt-1">JPG, PNG up to 10MB</p>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {files.map((f, i) => (
                        <div key={i} className="bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-xs px-3 py-1.5 rounded-lg font-medium">
                          ✓ {f.name}
                        </div>
                      ))}
                    </div>
                  )}
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                {(task.proof_spec.formFields ?? []).map((field: string) => (
                  <div key={field}>
                    <label className="block text-sm text-gray-400 mb-1 capitalize">{field}</label>
                    <input
                      type="text"
                      value={formData[field] ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full bg-white/3 border border-white/10 focus:border-[#00ff88]/50 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                      placeholder={`Enter ${field}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || (isPhoto && files.length === 0)}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting proof...
                </span>
              ) : 'Submit proof →'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
