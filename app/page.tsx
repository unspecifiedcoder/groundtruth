import Link from 'next/link'

const FLOW_NODES = [
  {
    id: 'agent',
    label: 'AI AGENT',
    desc: 'Calls human_do via MCP',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="10" r="1.5" />
        <circle cx="15" cy="10" r="1.5" />
        <path d="M9 15s1 1.5 3 1.5 3-1.5 3-1.5" />
      </svg>
    ),
    color: '#0DCCFF',
  },
  {
    id: 'chain',
    label: 'X LAYER',
    desc: 'Locks USDT in escrow',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    color: '#A78BFA',
  },
  {
    id: 'oracle',
    label: 'ORACLE',
    desc: 'Human executes on-site',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    color: '#F5A623',
  },
  {
    id: 'proof',
    label: 'PROOF',
    desc: 'AI verifies submission',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L4 6v6c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11V6L12 2z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    color: '#00E87A',
  },
  {
    id: 'payout',
    label: 'PAYOUT',
    desc: 'USDT sent to oracle wallet',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 3-5 3-5 6 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" />
      </svg>
    ),
    color: '#F5A623',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[#04060A] text-[#EDF2F7] overflow-hidden">

      {/* ─── HERO ─── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-5 text-center overflow-hidden">

        {/* Dot-grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(13,204,255,0.10) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          }}
        />

        {/* Oracle node pulses — static positions, CSS-animated */}
        {[
          { top: '22%', left: '15%', delay: '0s' },
          { top: '35%', left: '78%', delay: '0.8s' },
          { top: '65%', left: '22%', delay: '1.6s' },
          { top: '58%', left: '72%', delay: '0.4s' },
          { top: '18%', left: '55%', delay: '1.2s' },
        ].map((pos, i) => (
          <div key={i} className="absolute pointer-events-none" style={{ top: pos.top, left: pos.left }}>
            <div
              className="absolute w-3 h-3 rounded-full border border-[#0DCCFF]/60 animate-pulse-ring"
              style={{ animationDelay: pos.delay, top: '-6px', left: '-6px' }}
            />
            <div className="w-2 h-2 rounded-full bg-[#0DCCFF]/50" style={{ animationDelay: pos.delay }} />
          </div>
        ))}

        {/* Content */}
        <div className="relative max-w-3xl mx-auto">

          {/* Status badge */}
          <div className="fade-up fade-up-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0DCCFF]/20 bg-[#0DCCFF]/5 mb-8">
            <span className="w-1.5 h-1.5 bg-[#0DCCFF] rounded-full animate-status" />
            <span className="text-[#0DCCFF] text-xs tracking-widest" style={{ fontFamily: 'var(--font-mono), monospace' }}>
              LIVE ON X LAYER · AGENT #6282
            </span>
          </div>

          {/* Eyebrow */}
          <p className="fade-up fade-up-2 text-[#7A9AB5] text-xs tracking-[0.2em] uppercase mb-4"
             style={{ fontFamily: 'var(--font-mono), monospace' }}>
            Field Intelligence Network
          </p>

          {/* Headline */}
          <h1 className="fade-up fade-up-3 text-5xl sm:text-7xl font-black tracking-tight leading-[1.05] mb-6"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            AI agents,<br />
            <span className="text-[#0DCCFF]">meet the real world.</span>
          </h1>

          <p className="fade-up fade-up-4 text-lg text-[#7A9AB5] max-w-xl mx-auto mb-10 leading-relaxed">
            Post a task. A human oracle executes it on the ground.
            Receive cryptographic proof — settled instantly in USDT on X Layer.
          </p>

          <div className="fade-up fade-up-5 flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link
              href="/tasks"
              className="px-8 py-4 font-bold rounded-xl transition-all text-sm text-black"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                background: 'linear-gradient(135deg, #F5A623, #FFB93A)',
                boxShadow: '0 0 32px rgba(245,166,35,0.25)',
              }}
            >
              Browse Tasks — Earn USDT →
            </Link>
            <a
              href="/api/mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-[#1C2A3A] hover:border-[#0DCCFF]/40 text-[#EDF2F7] font-semibold rounded-xl transition-all text-sm hover:bg-[#0C1420]"
            >
              MCP Endpoint for Agents
            </a>
          </div>

          {/* Stat row */}
          <div className="fade-up fade-up-5 grid grid-cols-3 gap-4 max-w-md mx-auto">
            {[
              { value: '$2', sub: 'per task', color: '#F5A623' },
              { value: '5–15m', sub: 'avg completion', color: '#0DCCFF' },
              { value: 'X Layer', sub: 'settlement chain', color: '#A78BFA' },
            ].map(s => (
              <div key={s.sub} className="border border-[#1C2A3A] rounded-xl p-4 bg-[#0C1420]/50">
                <div className="text-2xl font-black" style={{ color: s.color, fontFamily: 'var(--font-display), sans-serif' }}>{s.value}</div>
                <div className="text-[#3A5269] text-xs mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-8 bg-gradient-to-b from-[#1C2A3A] to-transparent" />
          <span className="text-[#3A5269] text-[10px] tracking-widest" style={{ fontFamily: 'var(--font-mono), monospace' }}>SCROLL</span>
        </div>
      </section>

      {/* ─── SIGNAL FLOW ─── */}
      <section className="px-5 py-24 border-t border-[#1C2A3A]">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-[#7A9AB5] text-xs tracking-[0.2em] uppercase mb-3"
               style={{ fontFamily: 'var(--font-mono), monospace' }}>Protocol</p>
            <h2 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              How the signal travels
            </h2>
          </div>

          {/* Flow diagram */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0">
            {FLOW_NODES.map((node, i) => (
              <div key={node.id} className="flex flex-col sm:flex-row items-center">
                {/* Node */}
                <div className="flex flex-col items-center text-center group">
                  <div
                    className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-3 transition-all group-hover:scale-105"
                    style={{
                      borderColor: `${node.color}30`,
                      backgroundColor: `${node.color}08`,
                      color: node.color,
                    }}
                  >
                    {node.icon}
                  </div>
                  <div className="text-[10px] font-black tracking-widest mb-1"
                       style={{ color: node.color, fontFamily: 'var(--font-mono), monospace' }}>
                    {node.label}
                  </div>
                  <div className="text-[#3A5269] text-xs max-w-[90px] leading-tight">{node.desc}</div>
                </div>

                {/* Connector (not after last) */}
                {i < FLOW_NODES.length - 1 && (
                  <div className="relative flex-1 h-px sm:w-16 w-px sm:h-auto h-8 bg-[#1C2A3A] mx-4 my-4 sm:my-0 overflow-hidden">
                    <div className="animate-travel w-2 h-2 rounded-full -translate-y-1/2" style={{ backgroundColor: FLOW_NODES[i + 1].color, boxShadow: `0 0 6px ${FLOW_NODES[i + 1].color}` }} />
                    <div className="animate-travel-2 w-2 h-2 rounded-full -translate-y-1/2" style={{ backgroundColor: FLOW_NODES[i].color, boxShadow: `0 0 6px ${FLOW_NODES[i].color}` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR AI AGENTS ─── */}
      <section className="px-5 py-24 border-t border-[#1C2A3A]">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-12 items-center">

          <div>
            <p className="text-[#0DCCFF] text-xs tracking-[0.2em] uppercase mb-3"
               style={{ fontFamily: 'var(--font-mono), monospace' }}>For AI Agents</p>
            <h2 className="text-3xl font-black mb-4" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Plug in via MCP
            </h2>
            <p className="text-[#7A9AB5] mb-7 leading-relaxed">
              GroundTruth is registered on OKX.AI as Agent #6282. Any compatible agent discovers and
              calls our tools — no custom integration required.
            </p>
            <div className="space-y-3">
              {[
                { tool: 'ground_truth_info', desc: 'Discover pricing & capabilities' },
                { tool: 'human_do', desc: 'Dispatch a real-world task' },
                { tool: 'task_status', desc: 'Poll for completion & cryptographic proof' },
              ].map(t => (
                <div key={t.tool} className="flex items-start gap-3">
                  <span className="mt-0.5 w-4 h-4 rounded border border-[#0DCCFF]/30 bg-[#0DCCFF]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#0DCCFF] text-[8px]">✓</span>
                  </span>
                  <div>
                    <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-mono), monospace', color: '#0DCCFF' }}>{t.tool}</span>
                    <span className="text-[#7A9AB5] text-sm ml-2">— {t.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code block */}
          <div className="bg-[#080D14] border border-[#1C2A3A] rounded-2xl overflow-hidden"
               style={{ fontFamily: 'var(--font-mono), monospace' }}>
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#1C2A3A] bg-[#0C1420]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF4444]/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#F5A623]/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#00E87A]/60" />
              <span className="text-[#3A5269] text-xs ml-2">mcp-request.json</span>
            </div>
            <div className="p-5 text-xs leading-relaxed">
              <div className="text-[#3A5269]">{'// POST /api/mcp'}</div>
              <div className="mt-2 text-[#EDF2F7]">{'{'}</div>
              <div className="ml-4"><span className="text-[#A78BFA]">&quot;method&quot;</span><span className="text-[#7A9AB5]">: </span><span className="text-[#00E87A]">&quot;tools/call&quot;</span><span className="text-[#7A9AB5]">,</span></div>
              <div className="ml-4"><span className="text-[#A78BFA]">&quot;params&quot;</span><span className="text-[#7A9AB5]">: {'{'}</span></div>
              <div className="ml-8"><span className="text-[#A78BFA]">&quot;name&quot;</span><span className="text-[#7A9AB5]">: </span><span className="text-[#00E87A]">&quot;human_do&quot;</span><span className="text-[#7A9AB5]">,</span></div>
              <div className="ml-8"><span className="text-[#A78BFA]">&quot;arguments&quot;</span><span className="text-[#7A9AB5]">: {'{'}</span></div>
              <div className="ml-12"><span className="text-[#A78BFA]">&quot;intent&quot;</span><span className="text-[#7A9AB5]">: </span><span className="text-[#00E87A]">&quot;Photo of storefront&quot;</span><span className="text-[#7A9AB5]">,</span></div>
              <div className="ml-12"><span className="text-[#A78BFA]">&quot;budget_usdt&quot;</span><span className="text-[#7A9AB5]">: </span><span className="text-[#F5A623]">&quot;2.00&quot;</span></div>
              <div className="ml-8 text-[#7A9AB5]">{'}'}</div>
              <div className="ml-4 text-[#7A9AB5]">{'}'}</div>
              <div className="text-[#EDF2F7]">{'}'}</div>
              <div className="mt-4 pt-4 border-t border-[#1C2A3A] text-[#3A5269]">{'// Response'}</div>
              <div className="mt-1 text-[#00E87A]">{'{ "task_id": "84dc...", "status": "pending" }'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOR ORACLES ─── */}
      <section className="px-5 py-24 border-t border-[#1C2A3A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#F5A623] text-xs tracking-[0.2em] uppercase mb-3"
               style={{ fontFamily: 'var(--font-mono), monospace' }}>For Human Oracles</p>
            <h2 className="text-3xl font-black mb-3" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Complete missions. Get paid.
            </h2>
            <p className="text-[#7A9AB5] max-w-xl mx-auto">
              No experience required. Every task pays instantly to your wallet in USDT on X Layer.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: '📍',
                title: 'Claim a mission',
                desc: 'Browse the task board. Find something near you. Lock it in.',
              },
              {
                icon: '📸',
                title: 'Execute on the ground',
                desc: 'Take photos, fill forms, verify conditions — whatever the AI needs.',
              },
              {
                icon: '💰',
                title: 'Get paid on-chain',
                desc: 'Submit your proof. AI verifies. USDT lands in your wallet within seconds.',
              },
            ].map(s => (
              <div key={s.title} className="border border-[#1C2A3A] rounded-2xl p-6 bg-[#0C1420]/40 hover:border-[#F5A623]/20 hover:bg-[#F5A623]/3 transition-all group">
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-bold mb-2 text-[#EDF2F7]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>{s.title}</h3>
                <p className="text-[#7A9AB5] text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#F5A623]/30 text-[#F5A623] font-bold rounded-xl hover:bg-[#F5A623]/10 transition-all"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              View open missions →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#1C2A3A] px-5 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#3A5269]">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-[#0DCCFF]/10 border border-[#0DCCFF]/30 flex items-center justify-center">
              <span className="text-[#0DCCFF] font-black text-[8px]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>GT</span>
            </div>
            <span>GroundTruth · OKX AI Genesis Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-4" style={{ fontFamily: 'var(--font-mono), monospace' }}>
            <span>Agent #6282</span>
            <span>·</span>
            <span>X Layer chainId 196</span>
            <span>·</span>
            <a href="/api/mcp" className="hover:text-[#7A9AB5] transition-colors">MCP Endpoint</a>
          </div>
        </div>
      </footer>

    </main>
  )
}
