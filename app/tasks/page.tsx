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
    <main className="min-h-screen pb-20" style={{ color: 'var(--text)' }}>
      <div className="max-w-2xl mx-auto px-5">

        {/* Header */}
        <div className="pt-12 pb-8 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="chip flex items-center gap-2 mb-4" style={{ color: 'var(--good)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-status" style={{ background: 'var(--good)' }} />
            <span className="text-[10px]">Live · open missions</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--text)' }}>
                Mission Board
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Do it on the ground. Collect proof. Get paid instantly in USDT.
              </p>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>
                {tasks.length}
              </div>
              <div className="chip text-[10px]" style={{ color: 'var(--text-faint)' }}>Available</div>
            </div>
          </div>
        </div>

        {/* Task list */}
        <div className="mt-6">
          {tasks.length === 0 ? (
            <div className="card text-center py-24">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
                   style={{ background: 'var(--bg-subtle)' }}>
                🔭
              </div>
              <p className="font-medium" style={{ color: 'var(--text)' }}>No missions right now</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>AI agents haven&apos;t dispatched anything yet. Check back soon.</p>
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
                const typeColor = isPhoto ? 'var(--info)' : 'var(--accent)'

                return (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="card card-hover group relative p-5 cursor-pointer overflow-hidden">
                      {/* Left accent stripe */}
                      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full" style={{ background: typeColor }} />

                      <div className="pl-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px]" style={{ color: 'var(--text-faint)' }}>#{shortId}</span>
                            <span className="chip text-[10px] px-2 py-0.5 rounded-md font-bold"
                                  style={{ background: isPhoto ? 'var(--info-weak)' : 'var(--accent-weak)', color: typeColor }}>
                              {isPhoto ? '◉ Photo' : '◉ Form'}
                            </span>
                            {urgent && (
                              <span className="chip text-[10px] px-2 py-0.5 rounded-md font-bold"
                                    style={{ background: 'var(--warn-weak)', color: 'var(--warn)' }}>
                                ⚡ Urgent
                              </span>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-display text-2xl font-extrabold" style={{ color: 'var(--accent)' }}>
                              ${task.budget_usdt}
                            </div>
                            <div className="font-mono text-[10px]" style={{ color: 'var(--text-faint)' }}>USDT</div>
                          </div>
                        </div>

                        <p className="font-medium leading-snug line-clamp-2 mb-3" style={{ color: 'var(--text)' }}>
                          {task.intent}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs" style={{ color: urgent ? 'var(--warn)' : 'var(--text-faint)' }}>
                            {minsLeft < 60 ? `${minsLeft}m left` : `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m left`}
                          </span>
                          <span className="font-display text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: 'var(--accent)' }}>
                            Accept mission →
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

        <div className="mt-10 text-center font-mono text-xs" style={{ color: 'var(--text-faint)' }}>
          Settled on-chain · GroundTruthPayroll.sol · X Layer (chainId 196)
        </div>
      </div>
    </main>
  )
}
