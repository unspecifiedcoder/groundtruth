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
    <main className="min-h-screen bg-[#080c10] text-white p-4 pb-16">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 text-[#00ff88] text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
            Live tasks
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black">Oracle Task Board</h1>
              <p className="text-gray-400 text-sm mt-1">Complete tasks on the ground. Get paid in USDT.</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[#00ff88]">{tasks.length}</div>
              <div className="text-xs text-gray-500">available</div>
            </div>
          </div>
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <div className="text-center py-24 border border-white/5 rounded-2xl bg-white/2">
            <div className="text-5xl mb-4">🔭</div>
            <p className="text-gray-400 font-medium">No tasks right now</p>
            <p className="text-gray-600 text-sm mt-1">AI agents haven&apos;t posted anything yet. Check back soon.</p>
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

              return (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div className="group relative bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all cursor-pointer overflow-hidden">
                    {/* Left accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${isPhoto ? 'bg-[#00ff88]' : 'bg-blue-400'}`} />

                    <div className="flex items-start justify-between gap-4 pl-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold leading-snug line-clamp-2 group-hover:text-white transition-colors">
                          {task.intent}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                            isPhoto
                              ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
                              : 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                          }`}>
                            {isPhoto ? '📷' : '📋'} {isPhoto ? 'Photo proof' : 'Form proof'}
                          </span>
                          <span className={`text-xs ${urgent ? 'text-red-400' : 'text-gray-500'}`}>
                            {urgent ? '⚡' : '⏱'} {minsLeft < 60 ? `${minsLeft}m left` : `${Math.floor(minsLeft / 60)}h left`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-2xl font-black text-[#00ff88]">${task.budget_usdt}</div>
                        <div className="text-xs text-gray-500">USDT</div>
                        <div className="mt-2 text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
                          Claim →
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-600">
          Payments settled on-chain via X Layer · Powered by GroundTruth ASP #6282
        </div>
      </div>
    </main>
  )
}
