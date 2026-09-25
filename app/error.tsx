'use client'
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="min-h-[70vh] px-5 flex items-center justify-center"><div className="card max-w-lg p-8 text-center"><p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>Something went wrong</p><h1 className="font-display text-3xl font-extrabold mb-3">We could not complete that request.</h1><p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>No payment or submission should be repeated until you check its current status.</p><button className="btn btn-primary px-6 py-3" onClick={reset}>Try again</button></div></main>
}
