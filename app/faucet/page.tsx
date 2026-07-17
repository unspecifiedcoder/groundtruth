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
        setMessage(`10 mUSDT sent!`)
      }
    } catch {
      setStatus('error')
      setMessage('Network error — try again')
    }
  }

  return (
    <main className="min-h-screen bg-[#080c10] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 text-[#00ff88] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
            X Layer Testnet
          </div>
          <h1 className="text-4xl font-black mb-3">mUSDT Faucet</h1>
          <p className="text-gray-400">
            Get 10 Mock USDT to test GroundTruth task payments.<br />
            One drip per hour per address.
          </p>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full bg-white/3 border border-white/10 focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/20 rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all"
            />
          </div>

          <button
            onClick={handleDrip}
            disabled={status === 'loading'}
            className="w-full bg-[#00ff88] hover:bg-[#00e87a] disabled:opacity-40 text-black font-bold py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Sending 10 mUSDT...
              </span>
            ) : 'Request 10 mUSDT →'}
          </button>

          {status === 'error' && (
            <p className="text-red-400 text-sm text-center">{message}</p>
          )}

          {status === 'success' && (
            <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-xl p-4 text-center">
              <p className="text-[#00ff88] font-semibold">✓ {message}</p>
              {txHash && (
                <a
                  href={`https://www.oklink.com/xlayer-test/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-200 font-mono mt-2 block"
                >
                  {txHash.slice(0, 12)}…{txHash.slice(-8)} ↗
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white/2 border border-white/5 rounded-xl p-4 text-xs text-gray-500 space-y-1">
          <p><span className="text-gray-400 font-medium">Token:</span> Mock USDT (mUSDT)</p>
          <p><span className="text-gray-400 font-medium">Contract:</span> <span className="font-mono">0x725cCe0916d2E8682438732fD9e79803B4fAB2BD</span></p>
          <p><span className="text-gray-400 font-medium">Network:</span> X Layer Testnet (chainId 1952)</p>
          <p><span className="text-gray-400 font-medium">Amount:</span> 10 mUSDT per drip</p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/tasks" className="text-sm text-[#00ff88] hover:underline">
            → Browse tasks and earn real USDT
          </Link>
        </div>

      </div>
    </main>
  )
}
