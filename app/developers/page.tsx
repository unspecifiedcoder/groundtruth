import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Developer API, MCP, and A2A',
  description: 'Connect an AI agent or application to GroundTruth for verified real-world retail field evidence.',
  alternates: { canonical: '/developers' },
}

const STEPS = [
  ['1', 'Discover', 'Connect to the streamable HTTP MCP endpoint or read the OpenAPI document.'],
  ['2', 'Create and pay', 'Call human_do. If payment is required, follow the returned x402 challenge and retry.'],
  ['3', 'Poll', 'Store the task ID and poll task_status or the REST status URL. The workflow is asynchronous.'],
  ['4', 'Consume evidence', 'Use the verified result, explainable checks, and settlement receipt in your application.'],
]

export default function DevelopersPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
  return (
    <main className="min-h-screen px-5 py-14" style={{ color: 'var(--text)' }}>
      <div className="max-w-5xl mx-auto">
        <p className="chip text-[10px] mb-3" style={{ color: 'var(--info)' }}>Developer platform</p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-5">Call the physical world like software.</h1>
        <p className="text-lg max-w-3xl leading-relaxed mb-9" style={{ color: 'var(--text-muted)' }}>GroundTruth exposes an asynchronous API, MCP server, A2A interface, and machine-readable service catalog for creating funded field missions, tracking human execution, and retrieving verified evidence.</p>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          <a className="card card-hover p-6" href="/api/mcp"><div className="chip text-[9px] mb-3" style={{ color: 'var(--good)' }}>MCP</div><h2 className="font-display text-xl font-extrabold">Streamable HTTP endpoint</h2><code className="block text-sm mt-3 break-all" style={{ color: 'var(--text-muted)' }}>{base}/api/mcp</code></a>
          <a className="card card-hover p-6" href="/.well-known/agent-card.json"><div className="chip text-[9px] mb-3" style={{ color: 'var(--info)' }}>A2A 1.0</div><h2 className="font-display text-xl font-extrabold">Agent card and messaging</h2><code className="block text-sm mt-3 break-all" style={{ color: 'var(--text-muted)' }}>{base}/api/a2a</code></a>
          <a className="card card-hover p-6" href="/catalog.jsonl"><div className="chip text-[9px] mb-3" style={{ color: 'var(--good)' }}>JSON-LD</div><h2 className="font-display text-xl font-extrabold">Service catalog</h2><code className="block text-sm mt-3 break-all" style={{ color: 'var(--text-muted)' }}>{base}/catalog.jsonl</code></a>
          <a className="card card-hover p-6" href="/api/openapi"><div className="chip text-[9px] mb-3" style={{ color: 'var(--accent)' }}>REST</div><h2 className="font-display text-xl font-extrabold">OpenAPI 3.1 document</h2><code className="block text-sm mt-3 break-all" style={{ color: 'var(--text-muted)' }}>{base}/api/openapi</code></a>
        </div>

        <section className="mb-12"><h2 className="font-display text-3xl font-extrabold mb-6">Integration flow</h2><div className="grid sm:grid-cols-2 gap-4">{STEPS.map(([number, title, text]) => <div key={number} className="card p-5"><span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>{number}</span><h3 className="font-display font-bold mt-2">{title}</h3><p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--text-muted)' }}>{text}</p></div>)}</div></section>

        <section className="grid lg:grid-cols-2 gap-6 mb-12">
          <div><h2 className="font-display text-2xl font-extrabold mb-3">MCP tools</h2><ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}><li><code>ground_truth_info</code> — capabilities and current payment terms</li><li><code>human_do</code> — create a mission</li><li><code>task_status</code> — poll its outcome</li><li><code>review_task</code> — authorized review decision</li></ul></div>
          <div className="card p-5 font-mono text-xs overflow-x-auto"><pre>{`POST /api/v1/human-do\nContent-Type: application/json\n\n{\n  "intent": "Check Brand A at Store 42",\n  "service_tier": "photo_visit",\n  "target_location": {\n    "label": "Store 42",\n    "latitude": 12.9716,\n    "longitude": 77.5946\n  }\n}`}</pre></div>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-3xl font-extrabold mb-3">Predictable task pricing</h2>
          <p className="mb-5" style={{ color: 'var(--text-muted)' }}>The server maps each named tier to an exact x402 amount. Agents cannot advertise one reward and pay another.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="card p-4"><code>evaluation_test</code><strong className="block mt-2">0.10 USDC</strong></div>
            <div className="card p-4"><code>quick_check</code><strong className="block mt-2">2 USDT</strong></div>
            <div className="card p-4"><code>photo_visit</code><strong className="block mt-2">5 USDT</strong></div>
            <div className="card p-4"><code>urgent_visit</code><strong className="block mt-2">15 USDT</strong></div>
            <div className="card p-4"><code>complex_visit</code><strong className="block mt-2">50 USDT</strong></div>
          </div>
          <p className="text-xs mt-4" style={{ color: 'var(--text-faint)' }}><code>evaluation_test</code> is the public $0.10 paid-review tier. <code>integration_test</code> remains the $0.01 machine-compatibility floor, while <code>quick_check</code> is the smallest $2 field mission.</p>
        </section>

        <div className="rounded-xl p-5" style={{ background: 'var(--warn-weak)' }}><strong>Public beta:</strong> production traffic requires an agreed pilot, coverage confirmation, and payment configuration. Review the <Link className="underline" href="/trust">trust model</Link> and <Link className="underline" href="/acceptable-use">acceptable-use policy</Link> before dispatch.</div>
      </div>
    </main>
  )
}
