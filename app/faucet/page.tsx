'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function FaucetPage() {
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [txHash, setTxHash] = useState('')

  async function handleDrip() {
    if (!address.match(/^0x[0-9a-fA-F]{40}$/)) {
      setStatus('error')
      setMessage('Enter a valid 0x wallet address')
      return
    }
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Faucet failed')
      } else {
        setStatus('success')
        setTxHash(data.tx)
        setMessage('10 mUSDT sent!')
      }
    } catch {
      setStatus('error')
      setMessage('Network error — try again')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-5" style={{ color: 'var(--text)' }}>
      <div className="max-w-md w-full">

        <div className="text-center mb-10">
          <div className="chip inline-flex items-center gap-2 mb-5" style={{ color: 'var(--info)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-status" style={{ background: 'var(--info)' }} />
            <span className="text-[10px]">X Layer testnet</span>
          </div>
          <h1 className="font-display text-4xl font-extrabold mb-3" style={{ color: 'var(--text)' }}>
            mUSDT Faucet
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Get 10 Mock USDT to test GroundTruth task payments.<br />
            One drip per hour per address.
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <label className="chip block text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>
              Wallet address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="font-mono w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          <button
            onClick={handleDrip}
            disabled={status === 'loading'}
            className="btn btn-primary w-full py-4 disabled:opacity-40"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent-ink)', borderTopColor: 'transparent' }} />
                Sending 10 mUSDT...
              </span>
            ) : 'Request 10 mUSDT →'}
          </button>

          {status === 'error' && (
            <p className="text-sm text-center flex items-center justify-center gap-2" style={{ color: 'var(--accent)' }}>
              <span>⚠</span> {message}
            </p>
          )}

          {status === 'success' && (
            <div className="rounded-xl p-4 text-center" style={{ background: 'var(--good-weak)', border: '1px solid var(--good)' }}>
              <p className="font-semibold flex items-center justify-center gap-2" style={{ color: 'var(--good)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {message}
              </p>
              {txHash && (
                <a
                  href={`https://www.oklink.com/xlayer-test/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs mt-2 block transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-faint)' }}
                >
                  {txHash.slice(0, 12)}…{txHash.slice(-8)} ↗
                </a>
              )}
            </div>
          )}
        </div>

        <div className="card font-mono mt-5 p-4 text-xs space-y-1.5" style={{ color: 'var(--text-faint)' }}>
          <p><span style={{ color: 'var(--text-muted)' }}>Token:</span> Mock USDT (mUSDT)</p>
          <p className="break-all"><span style={{ color: 'var(--text-muted)' }}>Contract:</span> 0x725cCe0916d2E8682438732fD9e79803B4fAB2BD</p>
          <p><span style={{ color: 'var(--text-muted)' }}>Network:</span> X Layer Testnet (chainId 1952)</p>
          <p><span style={{ color: 'var(--text-muted)' }}>Amount:</span> 10 mUSDT per drip</p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/tasks" className="text-sm font-medium hover:underline" style={{ color: 'var(--accent)' }}>
            → Browse missions and earn real USDT
          </Link>
        </div>

      </div>
    </main>
  )
}
