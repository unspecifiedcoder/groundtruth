export const dynamic = 'force-dynamic'

async function getPendingReviews() {
  try {
    const url = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${url}/api/admin/queue`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function AdminPage() {
  const tasks = await getPendingReviews()

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Admin Review Queue</h1>
        <p className="text-gray-400 text-sm mb-6">Tasks flagged for manual verification</p>

        {tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-4">✅</div>
            <p>No tasks pending review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task: { id: string; intent: string; worker_wallet: string; budget_usdt: string; submitted_at: string }) => (
              <div key={task.id} className="bg-gray-900 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{task.intent}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      Worker: {task.worker_wallet?.slice(0, 10)}…
                    </p>
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(task.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-green-400 font-bold">${task.budget_usdt}</div>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <form action={`/api/admin/review/${task.id}`} method="POST">
                    <input type="hidden" name="action" value="approve" />
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
                    >
                      Approve & Pay
                    </button>
                  </form>
                  <form action={`/api/admin/review/${task.id}`} method="POST">
                    <input type="hidden" name="action" value="reject" />
                    <button
                      type="submit"
                      className="bg-red-900 hover:bg-red-800 text-white text-sm font-medium px-4 py-2 rounded-lg"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
