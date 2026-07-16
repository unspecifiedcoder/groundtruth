import { pulseStats } from '@/lib/db'

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
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-2">Live Payroll</h1>
        <p className="text-gray-400 text-sm mb-8">Real-time GroundTruth economy stats</p>

        {stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-xl p-5">
              <div className="text-3xl font-bold text-green-400">${stats.total_paid_usdt}</div>
              <div className="text-gray-400 text-sm mt-1">Total paid out</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-5">
              <div className="text-3xl font-bold text-blue-400">{stats.verified_tasks}</div>
              <div className="text-gray-400 text-sm mt-1">Tasks verified</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-5">
              <div className="text-3xl font-bold text-purple-400">{stats.active_workers}</div>
              <div className="text-gray-400 text-sm mt-1">Active oracles</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-5">
              <div className="text-3xl font-bold text-yellow-400">{stats.total_tasks}</div>
              <div className="text-gray-400 text-sm mt-1">Total tasks</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">Stats loading...</div>
        )}

        <div className="mt-8 bg-gray-900 rounded-xl p-4">
          <p className="text-xs text-gray-500">
            All payouts settled on-chain via GroundTruthPayroll.sol on X Layer (chainId 196).
            Refreshes every 30 seconds.
          </p>
        </div>
      </div>
    </main>
  )
}
