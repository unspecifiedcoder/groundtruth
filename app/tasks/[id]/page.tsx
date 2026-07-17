'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const VERIFY_STEPS = [
  { label: 'Uploading proof to GroundTruth network...', duration: 600 },
  { label: 'Extracting image metadata & EXIF data...', duration: 700 },
  { label: 'Running AI vision analysis...', duration: 900 },
  { label: 'Checking against mission requirements...', duration: 600 },
  { label: 'Proof confirmed ✓', duration: 400 },
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

  const confirmed = step === VERIFY_STEPS.length - 1

  return (
    <div className="min-h-screen bg-[#04060A] flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full">

        {/* Status icon */}
        <div className="flex justify-center mb-8">
          <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center transition-all duration-500 ${
            confirmed
              ? 'border-[#00E87A]/40 bg-[#00E87A]/10'
              : 'border-[#0DCCFF]/20 bg-[#0DCCFF]/5'
          }`}>
            {confirmed ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00E87A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <div className="w-8 h-8 border-2 border-[#0DCCFF] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>

        <h2 className={`text-xl font-black text-center mb-8 transition-colors duration-300 ${confirmed ? 'text-[#00E87A]' : 'text-[#EDF2F7]'}`}
            style={{ fontFamily: 'var(--font-display), sans-serif' }}>
          {VERIFY_STEPS[step].label}
        </h2>

        <div className="space-y-2">
          {VERIFY_STEPS.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
              i < step ? 'opacity-30' : i === step ? 'bg-[#0C1420] border border-[#1C2A3A]' : 'opacity-10'
            }`}>
              <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center ${
                i < step || (i === step && confirmed)
                  ? 'bg-[#00E87A]'
                  : i === step
                  ? 'border border-[#0DCCFF]'
                  : 'border border-[#1C2A3A]'
              }`}>
                {(i < step || (i === step && confirmed)) && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-[#7A9AB5]">{s.label}</span>
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
      if (!res.ok) { setError('Failed to claim — mission may already be taken'); return }
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
      setPhase('verifying')
      await new Promise(r => setTimeout(r, 3200))
      setPhase('submitted')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  /* ── Loading ── */
  if (phase === 'loading') return (
    <div className="min-h-screen bg-[#04060A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#0DCCFF] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#7A9AB5] text-sm" style={{ fontFamily: 'var(--font-mono), monospace' }}>Loading mission...</p>
      </div>
    </div>
  )

  /* ── Error ── */
  if (phase === 'error' || !task) return (
    <div className="min-h-screen bg-[#04060A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl border border-[#1C2A3A] flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
        <p className="text-[#7A9AB5]">Mission not found</p>
        <button onClick={() => router.push('/tasks')} className="mt-4 text-sm text-[#0DCCFF] hover:underline">
          ← Back to board
        </button>
      </div>
    </div>
  )

  /* ── Verifying ── */
  if (phase === 'verifying') return <VerifyingScreen />

  /* ── Submitted ── */
  if (phase === 'submitted') return (
    <div className="min-h-screen bg-[#04060A] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <div className="w-20 h-20 rounded-2xl border border-[#00E87A]/30 bg-[#00E87A]/8 flex items-center justify-center mx-auto mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00E87A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
          Mission complete.
        </h2>
        <p className="text-[#7A9AB5] mb-2">Your proof has been verified by AI.</p>
        <p className="text-sm text-[#3A5269] mb-8">
          <span className="text-[#F5A623] font-bold">${task.budget_usdt} USDT</span> is being sent to{' '}
          <span style={{ fontFamily: 'var(--font-mono), monospace' }} className="text-[#7A9AB5] text-xs">
            {wallet.slice(0, 6)}…{wallet.slice(-4)}
          </span>
        </p>
        <button
          onClick={() => router.push('/tasks')}
          className="w-full py-3 rounded-xl font-bold text-black transition-all"
          style={{ background: 'linear-gradient(135deg, #F5A623, #FFB93A)', fontFamily: 'var(--font-display), sans-serif' }}
        >
          Find more missions →
        </button>
      </div>
    </div>
  )

  const isPhoto = task.proof_spec.type === 'photo'
  const expiresAt = new Date(task.expires_at)
  const minsLeft = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000))
  const urgent = minsLeft < 30
  const shortId = task.id.replace(/-/g, '').slice(0, 8).toUpperCase()

  return (
    <main className="min-h-screen bg-[#04060A] text-[#EDF2F7] pb-20">
      <div className="max-w-lg mx-auto px-5 py-8">

        {/* Back */}
        <button
          onClick={() => router.push('/tasks')}
          className="text-[#3A5269] hover:text-[#7A9AB5] text-sm mb-8 flex items-center gap-2 transition-colors"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          ← MISSION BOARD
        </button>

        {/* Mission brief header */}
        <div className="border border-[#1C2A3A] rounded-2xl p-6 mb-6 bg-[#0C1420]/40">

          {/* ID + type row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-[#3A5269] text-[10px]" style={{ fontFamily: 'var(--font-mono), monospace' }}>
                MISSION #{shortId}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider border ${
                isPhoto
                  ? 'bg-[#0DCCFF]/8 text-[#0DCCFF] border-[#0DCCFF]/20'
                  : 'bg-[#A78BFA]/8 text-[#A78BFA] border-[#A78BFA]/20'
              }`} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                {isPhoto ? '◉ PHOTO' : '◉ FORM'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-[#F5A623]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                ${task.budget_usdt}
              </div>
              <div className="text-[#3A5269] text-[10px]" style={{ fontFamily: 'var(--font-mono), monospace' }}>USDT REWARD</div>
            </div>
          </div>

          {/* Intent */}
          <h1 className="text-xl font-bold mb-3 text-[#EDF2F7]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            {task.intent}
          </h1>

          {/* Instructions */}
          <p className="text-[#7A9AB5] text-sm leading-relaxed mb-4">{task.proof_spec.instructions}</p>

          {/* Timer */}
          <div className={`flex items-center gap-2 text-xs ${urgent ? 'text-[#FF4444]' : 'text-[#3A5269]'}`}
               style={{ fontFamily: 'var(--font-mono), monospace' }}>
            <span>{urgent ? '⚡' : '⏱'}</span>
            <span>
              {minsLeft < 60
                ? `Expires in ${minsLeft}m`
                : `Expires in ${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`}
            </span>
          </div>
        </div>

        {/* ── CLAIM PHASE ── */}
        {phase === 'view' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold tracking-wider text-[#7A9AB5] mb-2 uppercase"
                     style={{ fontFamily: 'var(--font-mono), monospace' }}>
                Your wallet address (to receive USDT)
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={wallet}
                onChange={e => setWallet(e.target.value)}
                className="w-full bg-[#0C1420] border border-[#1C2A3A] focus:border-[#0DCCFF]/50 focus:ring-1 focus:ring-[#0DCCFF]/20 rounded-xl px-4 py-3 text-sm text-[#EDF2F7] outline-none transition-all placeholder-[#3A5269]"
                style={{ fontFamily: 'var(--font-mono), monospace' }}
              />
            </div>

            {error && (
              <p className="text-[#FF4444] text-sm flex items-center gap-2">
                <span>⚠</span> {error}
              </p>
            )}

            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-black transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #F5A623, #FFB93A)',
                fontFamily: 'var(--font-display), sans-serif',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Locking mission...
                </span>
              ) : 'Accept This Mission →'}
            </button>

            <p className="text-xs text-[#3A5269] text-center" style={{ fontFamily: 'var(--font-mono), monospace' }}>
              Once accepted, complete before the timer expires
            </p>
          </div>
        )}

        {/* ── CLAIMED / SUBMISSION PHASE ── */}
        {phase === 'claimed' && (
          <div className="space-y-5">
            <div className="border border-[#00E87A]/20 bg-[#00E87A]/5 rounded-xl p-4 flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E87A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-[#00E87A] text-sm font-medium">Mission locked. Submit your proof before it expires.</p>
            </div>

            {isPhoto ? (
              <div>
                <label className="block text-xs font-bold tracking-wider text-[#7A9AB5] mb-2 uppercase"
                       style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  Upload {task.proof_spec.minPhotos ?? 1}+ photo{(task.proof_spec.minPhotos ?? 1) > 1 ? 's' : ''}
                </label>
                <label className="block w-full border-2 border-dashed border-[#1C2A3A] hover:border-[#0DCCFF]/40 rounded-xl p-8 text-center cursor-pointer transition-colors group bg-[#0C1420]/20">
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
                      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📸</div>
                      <p className="text-[#7A9AB5] text-sm font-medium">Tap to take photo or upload</p>
                      <p className="text-[#3A5269] text-xs mt-1">JPG, PNG up to 10MB</p>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {files.map((f, i) => (
                        <div key={i} className="bg-[#00E87A]/8 border border-[#00E87A]/20 text-[#00E87A] text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {f.name}
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
                    <label className="block text-xs font-bold tracking-wider text-[#7A9AB5] mb-2 uppercase capitalize"
                           style={{ fontFamily: 'var(--font-mono), monospace' }}>
                      {field}
                    </label>
                    <input
                      type="text"
                      value={formData[field] ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full bg-[#0C1420] border border-[#1C2A3A] focus:border-[#0DCCFF]/50 rounded-xl px-4 py-3 text-sm text-[#EDF2F7] outline-none transition-all placeholder-[#3A5269]"
                      placeholder={`Enter ${field}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="text-[#FF4444] text-sm flex items-center gap-2">
                <span>⚠</span> {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || (isPhoto && files.length === 0)}
              className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #0DCCFF22, #0DCCFF44)',
                border: '1px solid rgba(13,204,255,0.4)',
                color: '#0DCCFF',
                fontFamily: 'var(--font-display), sans-serif',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0DCCFF] border-t-transparent rounded-full animate-spin" />
                  Uploading proof...
                </span>
              ) : 'Submit Proof →'}
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
