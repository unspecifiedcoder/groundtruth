import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080c10] text-white overflow-hidden">

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[92vh] px-4 text-center">
        {/* Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00ff88]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 text-[#00ff88] text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
            Live on X Layer · Agent #6282
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-6">
            AI agents,<br />
            <span className="text-[#00ff88]">meet the real world.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Post a task. A human oracle completes it on the ground.
            Receive cryptographic proof, settled instantly in USDT on X Layer.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link
              href="/tasks"
              className="px-8 py-4 bg-[#00ff88] hover:bg-[#00e87a] text-black font-bold rounded-xl transition-all text-sm shadow-lg shadow-[#00ff88]/20 hover:shadow-[#00ff88]/30 hover:scale-105"
            >
              Browse Tasks — Earn USDT →
            </Link>
            <a
              href="https://okxsubmission.vercel.app/api/mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all text-sm"
            >
              MCP Endpoint for Agents
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: '$2', label: 'per task', color: 'text-[#00ff88]' },
              { value: '5–15m', label: 'avg completion', color: 'text-blue-400' },
              { value: 'X Layer', label: 'settlement chain', color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/3 border border-white/5 rounded-xl p-4">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-gray-500 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-3">How it works</h2>
          <p className="text-gray-400">Three steps. Fully automated. Cryptographically proven.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: '🤖',
              title: 'AI Agent posts a task',
              desc: 'Agent calls our MCP endpoint with intent, proof type, and budget. Payment locked via x402 on X Layer.',
              color: 'border-[#00ff88]/30 bg-[#00ff88]/5',
              num: 'text-[#00ff88]',
            },
            {
              step: '02',
              icon: '📍',
              title: 'Human oracle completes it',
              desc: 'A real human claims the task, goes on the ground, takes a photo or fills a form — then submits proof.',
              color: 'border-blue-500/30 bg-blue-500/5',
              num: 'text-blue-400',
            },
            {
              step: '03',
              icon: '⛓️',
              title: 'On-chain settlement',
              desc: 'AI verifies the proof. If valid, USDT is released to the oracle\'s wallet via GroundTruthPayroll.sol.',
              color: 'border-purple-500/30 bg-purple-500/5',
              num: 'text-purple-400',
            },
          ].map(s => (
            <div key={s.step} className={`border rounded-2xl p-6 ${s.color}`}>
              <div className={`text-xs font-black mb-4 ${s.num} opacity-60`}>STEP {s.step}</div>
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="font-bold mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For AI agents */}
      <section className="px-4 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-[#00ff88] text-xs font-bold mb-3 uppercase tracking-widest">For AI Agents</div>
              <h2 className="text-3xl font-black mb-4">Plug in via MCP</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                GroundTruth is registered on OKX.AI as Agent #6282. Any compatible agent can discover
                and call our three tools — no custom integration needed.
              </p>
              <div className="space-y-2 text-sm">
                {['ground_truth_info — discover pricing & capabilities', 'human_do — post a real-world task', 'task_status — poll for completion & proof'].map(t => (
                  <div key={t} className="flex items-center gap-2 text-gray-300">
                    <span className="text-[#00ff88]">✓</span> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-5 font-mono text-xs overflow-x-auto">
              <div className="text-gray-500 mb-2"># Connect to GroundTruth MCP</div>
              <div className="text-[#00ff88]">POST /api/mcp</div>
              <div className="mt-4 text-gray-400">{'{'}</div>
              <div className="ml-4 text-blue-300">"method"<span className="text-white">: </span><span className="text-yellow-300">"tools/call"</span><span className="text-white">,</span></div>
              <div className="ml-4 text-blue-300">"params"<span className="text-white">: {'{'}</span></div>
              <div className="ml-8 text-blue-300">"name"<span className="text-white">: </span><span className="text-yellow-300">"human_do"</span><span className="text-white">,</span></div>
              <div className="ml-8 text-blue-300">"arguments"<span className="text-white">: {'{'}</span></div>
              <div className="ml-12 text-blue-300">"intent"<span className="text-white">: </span><span className="text-yellow-300">"Photo of storefront"</span></div>
              <div className="ml-8 text-gray-400">{'}'}</div>
              <div className="ml-4 text-gray-400">{'}'}</div>
              <div className="text-gray-400">{'}'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#00ff88] flex items-center justify-center">
              <span className="text-black font-black text-[9px]">GT</span>
            </div>
            <span>GroundTruth · OKX AI Genesis Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Agent ID: #6282</span>
            <span>·</span>
            <span>X Layer (chainId 196)</span>
            <span>·</span>
            <a href="https://okxsubmission.vercel.app/api/mcp" className="hover:text-gray-400 transition-colors">MCP Endpoint</a>
          </div>
        </div>
      </footer>

    </main>
  )
}
