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
    <main className="min-h-screen bg-[#04060A] text-[#EDF2F7] flex items-center justify-center p-5">
      <div className="max-w-md w-full">

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0DCCFF] animate-status" />
            <span className="text-[#0DCCFF] text-[10px] tracking-widest" style={{ fontFamily: 'var(--font-mono), monospace' }}>
              X LAYER TESTNET
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#EDF2F7] mb-3" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            mUSDT Faucet
          </h1>
          <p className="text-[#7A9AB5]">
            Get 10 Mock USDT to test GroundTruth task payments.<br />
            One drip per hour per address.
          </p>
        </div>

        <div className="border border-[#1C2A3A] rounded-2xl p-6 bg-[#0C1420]/40 space-y-4">
          <div>
            <label className="block text-xs font-bold tracking-wider text-[#7A9AB5] mb-2 uppercase"
                   style={{ fontFamily: 'var(--font-mono), monospace' }}>
              Wallet address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full bg-[#080D14] border border-[#1C2A3A] focus:border-[#0DCCFF]/50 focus:ring-1 focus:ring-[#0DCCFF]/20 rounded-xl px-4 py-3 text-sm text-[#EDF2F7] outline-none transition-all placeholder-[#3A5269]"
              style={{ fontFamily: 'var(--font-mono), monospace' }}
            />
          </div>

          <button
            onClick={handleDrip}
            disabled={status === 'loading'}
            className="w-full py-4 rounded-xl font-bold text-black transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #0DCCFF, #38D9F5)',
              fontFamily: 'var(--font-display), sans-serif',
            }}
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Sending 10 mUSDT...
              </span>
            ) : 'Request 10 mUSDT →'}
          </button>

          {status === 'error' && (
            <p className="text-[#FF4444] text-sm text-center flex items-center justify-center gap-2">
              <span>⚠</span> {message}
            </p>
          )}

          {status === 'success' && (
            <div className="border border-[#00E87A]/20 bg-[#00E87A]/5 rounded-xl p-4 text-center">
              <p className="text-[#00E87A] font-semibold flex items-center justify-center gap-2">
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
                  className="text-xs text-[#3A5269] hover:text-[#7A9AB5] mt-2 block transition-colors"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                  {txHash.slice(0, 12)}…{txHash.slice(-8)} ↗
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 border border-[#1C2A3A] rounded-xl p-4 text-xs text-[#3A5269] space-y-1.5"
             style={{ fontFamily: 'var(--font-mono), monospace' }}>
          <p><span className="text-[#7A9AB5]">Token:</span> Mock USDT (mUSDT)</p>
          <p><span className="text-[#7A9AB5]">Contract:</span> 0x725cCe0916d2E8682438732fD9e79803B4fAB2BD</p>
          <p><span className="text-[#7A9AB5]">Network:</span> X Layer Testnet (chainId 1952)</p>
          <p><span className="text-[#7A9AB5]">Amount:</span> 10 mUSDT per drip</p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/tasks" className="text-sm text-[#F5A623] hover:underline font-medium">
            → Browse missions and earn real USDT
          </Link>
        </div>

      </div>
    </main>
  )
}
