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
    <main className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Open Tasks</h1>
          <span className="text-sm text-gray-400">{tasks.length} available</span>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-4">👀</div>
            <p>No tasks right now. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task: { id: string; intent: string; budget_usdt: string; proof_spec: { type: string }; expires_at: string }) => (
              <Link key={task.id} href={`/tasks/${task.id}`}>
                <div className="bg-gray-900 hover:bg-gray-800 rounded-xl p-4 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-snug line-clamp-2">{task.intent}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                          {task.proof_spec.type === 'photo' ? '📷 Photo' : '📋 Form'}
                        </span>
                        <span className="text-xs text-gray-500">
                          expires {new Date(task.expires_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-green-400 font-bold">${task.budget_usdt}</div>
                      <div className="text-xs text-gray-500">USDT</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
