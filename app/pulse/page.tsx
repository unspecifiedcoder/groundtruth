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
    <main className="min-h-screen bg-[#080c10] text-white pb-16">
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 text-[#00ff88] text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
            Live · updates every 30s
          </div>
          <h1 className="text-3xl font-black">Payroll Pulse</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time GroundTruth economy stats</p>
        </div>

        {stats ? (
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: `$${stats.total_paid_usdt}`, label: 'Total paid out', color: 'text-[#00ff88]', bg: 'bg-[#00ff88]/5 border-[#00ff88]/15' },
              { value: String(stats.verified_tasks), label: 'Tasks verified', color: 'text-blue-400', bg: 'bg-blue-400/5 border-blue-400/15' },
              { value: String(stats.active_workers), label: 'Active oracles', color: 'text-purple-400', bg: 'bg-purple-400/5 border-purple-400/15' },
              { value: String(stats.total_tasks), label: 'Total tasks posted', color: 'text-yellow-400', bg: 'bg-yellow-400/5 border-yellow-400/15' },
            ].map(s => (
              <div key={s.label} className={`border rounded-2xl p-6 ${s.bg}`}>
                <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-gray-400 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin mx-auto mb-4" />
            Loading stats...
          </div>
        )}

        <div className="mt-8 bg-white/3 border border-white/8 rounded-2xl p-5">
          <div className="text-xs text-gray-500 leading-relaxed">
            All payouts settled on-chain via{' '}
            <a
              href="https://www.oklink.com/xlayer/address/0x430172985b21458d73576435D4aD4bEeA85F376C"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff88] hover:underline font-mono"
            >
              GroundTruthPayroll.sol
            </a>{' '}
            on X Layer (chainId 196). Contract immutable, open-source.
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/tasks" className="text-sm text-[#00ff88] hover:underline">
            → Browse open tasks and start earning
          </Link>
        </div>

      </div>
    </main>
  )
}
