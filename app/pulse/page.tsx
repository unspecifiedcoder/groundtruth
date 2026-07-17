import { pulseStats } from '@/lib/db'
import Link from 'next/link'

export const revalidate = 30

async function getStats() {
  try {
    return await pulseStats()
  } catch {
    return null
  }
}

export default async function PulsePage() {
  const stats = await getStats()

  return (
    <main className="min-h-screen bg-[#04060A] text-[#EDF2F7] pb-16">
      <div className="max-w-xl mx-auto px-5 py-12">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E87A] animate-status" />
            <span className="text-[#00E87A] text-[10px] tracking-widest" style={{ fontFamily: 'var(--font-mono), monospace' }}>
              LIVE · UPDATES EVERY 30s
            </span>
          </div>
          <h1 className="text-3xl font-black text-[#EDF2F7]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Network Pulse
          </h1>
          <p className="text-[#7A9AB5] text-sm mt-1">Real-time GroundTruth economy stats</p>
        </div>

        {stats ? (
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: `$${stats.total_paid_usdt}`, label: 'Total paid out', accent: '#F5A623' },
              { value: String(stats.verified_tasks), label: 'Missions verified', accent: '#00E87A' },
              { value: String(stats.active_workers), label: 'Active oracles', accent: '#A78BFA' },
              { value: String(stats.total_tasks), label: 'Tasks posted', accent: '#0DCCFF' },
            ].map(s => (
              <div key={s.label} className="border border-[#1C2A3A] rounded-2xl p-6 bg-[#0C1420]/40">
                <div className="text-3xl font-black" style={{ color: s.accent, fontFamily: 'var(--font-display), sans-serif' }}>
                  {s.value}
                </div>
                <div className="text-[#7A9AB5] text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#1C2A3A] border-t-[#0DCCFF] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#3A5269] text-sm" style={{ fontFamily: 'var(--font-mono), monospace' }}>Loading stats...</p>
          </div>
        )}

        <div className="mt-8 border border-[#1C2A3A] rounded-2xl p-5 bg-[#0C1420]/20">
          <p className="text-xs text-[#3A5269] leading-relaxed" style={{ fontFamily: 'var(--font-mono), monospace' }}>
            All payouts settled on-chain via{' '}
            <a
              href="https://www.oklink.com/xlayer/address/0x430172985b21458d73576435D4aD4bEeA85F376C"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0DCCFF] hover:underline"
            >
              GroundTruthPayroll.sol
            </a>{' '}
            · X Layer (chainId 196) · Contract immutable, open-source.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/tasks" className="text-sm text-[#F5A623] hover:underline font-medium">
            → Browse open missions and start earning
          </Link>
        </div>

      </div>
    </main>
  )
}
