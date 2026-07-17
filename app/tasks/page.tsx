import Link from 'next/link'
import { listOpenTasks } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getOpenTasks() {
  try {
    return await listOpenTasks()
  } catch {
    return []
  }
}

export default async function TasksPage() {
  const tasks = await getOpenTasks()

  return (
    <main className="min-h-screen bg-[#04060A] text-[#EDF2F7] pb-20">
      <div className="max-w-2xl mx-auto px-5">

        {/* Header */}
        <div className="pt-12 pb-8 border-b border-[#1C2A3A]">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E87A] animate-status" />
            <span className="text-[#00E87A] text-[10px] tracking-widest" style={{ fontFamily: 'var(--font-mono), monospace' }}>
              LIVE · OPEN MISSIONS
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-[#EDF2F7]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                Mission Board
              </h1>
              <p className="text-[#7A9AB5] text-sm mt-1">
                Execute on the ground. Collect proof. Get paid instantly in USDT.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-[#F5A623]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                {tasks.length}
              </div>
              <div className="text-[#3A5269] text-xs" style={{ fontFamily: 'var(--font-mono), monospace' }}>AVAILABLE</div>
            </div>
          </div>
        </div>

        {/* Task list */}
        <div className="mt-6">
          {tasks.length === 0 ? (
            <div className="text-center py-28 border border-[#1C2A3A] rounded-2xl bg-[#0C1420]/30">
              <div className="w-12 h-12 rounded-full border border-[#1C2A3A] flex items-center justify-center mx-auto mb-4 text-xl">
                🔭
              </div>
              <p className="text-[#7A9AB5] font-medium">No missions right now</p>
              <p className="text-[#3A5269] text-sm mt-1">AI agents haven&apos;t dispatched anything yet. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task: {
                id: string
                intent: string
                budget_usdt: string
                proof_spec: { type: string }
                expires_at: string
              }) => {
                const isPhoto = task.proof_spec.type === 'photo'
                const expiresAt = new Date(task.expires_at)
                const minsLeft = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000))
                const urgent = minsLeft < 30
                const shortId = task.id.replace(/-/g, '').slice(0, 8).toUpperCase()

                return (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="group relative border border-[#1C2A3A] hover:border-[#F5A623]/30 bg-[#0C1420]/40 hover:bg-[#0C1420]/70 rounded-2xl p-5 transition-all cursor-pointer overflow-hidden">

                      {/* Left accent stripe */}
                      <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full ${isPhoto ? 'bg-[#0DCCFF]' : 'bg-[#A78BFA]'}`} />

                      <div className="pl-4">
                        {/* Top row: ID + type + payout */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[#3A5269] text-[10px]" style={{ fontFamily: 'var(--font-mono), monospace' }}>
                              #{shortId}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider border ${
                              isPhoto
                                ? 'bg-[#0DCCFF]/8 text-[#0DCCFF] border-[#0DCCFF]/20'
                                : 'bg-[#A78BFA]/8 text-[#A78BFA] border-[#A78BFA]/20'
                            }`} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                              {isPhoto ? '◉ PHOTO' : '◉ FORM'}
                            </span>
                            {urgent && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider border bg-[#FF4444]/8 text-[#FF4444] border-[#FF4444]/20"
                                    style={{ fontFamily: 'var(--font-mono), monospace' }}>
                                ⚡ URGENT
                              </span>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl font-black text-[#F5A623]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                              ${task.budget_usdt}
                            </div>
                            <div className="text-[#3A5269] text-[10px]" style={{ fontFamily: 'var(--font-mono), monospace' }}>USDT</div>
                          </div>
                        </div>

                        {/* Intent */}
                        <p className="text-[#EDF2F7] font-medium leading-snug line-clamp-2 mb-3 group-hover:text-white transition-colors">
                          {task.intent}
                        </p>

                        {/* Bottom row: timer + claim */}
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${urgent ? 'text-[#FF4444]' : 'text-[#3A5269]'}`}
                                style={{ fontFamily: 'var(--font-mono), monospace' }}>
                            {minsLeft < 60
                              ? `${minsLeft}m remaining`
                              : `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m remaining`}
                          </span>
                          <span className="text-[#F5A623] text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                            ACCEPT MISSION →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-10 text-center text-[#3A5269] text-xs" style={{ fontFamily: 'var(--font-mono), monospace' }}>
          Settled on-chain · GroundTruthPayroll.sol · X Layer (chainId 196)
        </div>
      </div>
    </main>
  )
}
