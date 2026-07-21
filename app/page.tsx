import Link from 'next/link'

/* ── Signature element: a friendly "reality globe" with live oracle pins ──
   A dotted sphere (latitude/longitude ellipses), a slow-rotating orbit ring,
   and coral/leaf pins that pop like humans checking in from around the world. */
function RealityGlobe() {
  const pins = [
    { cx: 118, cy: 96, c: 'var(--accent)', d: '0s' },
    { cx: 176, cy: 128, c: 'var(--good)', d: '0.7s' },
    { cx: 96, cy: 150, c: 'var(--good)', d: '1.4s' },
    { cx: 150, cy: 74, c: 'var(--accent)', d: '1.0s' },
    { cx: 190, cy: 176, c: 'var(--warn)', d: '0.4s' },
  ]
  return (
    <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] animate-float">
      {/* soft halo */}
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: 'radial-gradient(circle at 50% 45%, var(--accent-weak), transparent 65%)' }}
      />
      {/* rotating orbit ring */}
      <svg viewBox="0 0 280 280" className="absolute inset-0 w-full h-full animate-spin-slow" aria-hidden>
        <ellipse cx="140" cy="140" rx="132" ry="52" fill="none" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 7" />
      </svg>
      {/* globe */}
      <svg viewBox="0 0 280 280" className="absolute inset-0 w-full h-full" role="img" aria-label="A globe with human oracles checking in from around the world">
        <defs>
          <radialGradient id="sphere" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="var(--bg-elev)" />
            <stop offset="100%" stopColor="var(--bg-subtle)" />
          </radialGradient>
        </defs>
        <circle cx="140" cy="140" r="96" fill="url(#sphere)" stroke="var(--border-strong)" strokeWidth="1.5" />
        {/* longitude */}
        {[28, 55, 82].map((rx, i) => (
          <ellipse key={`lo${i}`} cx="140" cy="140" rx={rx} ry="96" fill="none" stroke="var(--border)" strokeWidth="1" />
        ))}
        {/* latitude */}
        {[-52, 0, 52].map((off, i) => (
          <ellipse key={`la${i}`} cx="140" cy={140 + off} rx="96" ry={off === 0 ? 96 : 74} fill="none" stroke="var(--border)" strokeWidth="1" />
        ))}
        {/* pins */}
        {pins.map((p, i) => (
          <g key={i} className="animate-pin" style={{ transformOrigin: `${p.cx}px ${p.cy}px`, animationDelay: p.d }}>
            <circle cx={p.cx} cy={p.cy} r="12" fill={p.c} opacity="0.18" />
            <circle cx={p.cx} cy={p.cy} r="5" fill={p.c} />
            <circle cx={p.cx} cy={p.cy} r="2" fill="var(--bg-elev)" />
          </g>
        ))}
      </svg>
      {/* floating "verified" stamp */}
      <div
        className="absolute -bottom-2 -right-1 sm:right-2 card px-3 py-2 flex items-center gap-2 rotate-[-6deg]"
        style={{ borderRadius: '14px' }}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px]" style={{ background: 'var(--good-weak)', color: 'var(--good)' }}>✓</span>
        <div className="leading-tight">
          <div className="font-display text-[11px] font-bold" style={{ color: 'var(--text)' }}>Proof verified</div>
          <div className="font-mono text-[9px]" style={{ color: 'var(--text-faint)' }}>paid on X Layer</div>
        </div>
      </div>
    </div>
  )
}

const FLOW = [
  { label: 'AI asks', desc: 'An agent calls human_do via MCP', emoji: '🤖', c: 'var(--info)' },
  { label: 'Escrow', desc: 'USDT locked on X Layer', emoji: '🔒', c: 'var(--accent)' },
  { label: 'Human acts', desc: 'A real person goes on-site', emoji: '🚶', c: 'var(--good)' },
  { label: 'Proof', desc: 'Photo or form, verified', emoji: '📸', c: 'var(--info)' },
  { label: 'Payout', desc: 'USDT to the oracle, instantly', emoji: '💸', c: 'var(--good)' },
]

export default function Home() {
  return (
    <main className="overflow-hidden" style={{ color: 'var(--text)' }}>

      {/* ─── HERO ─── */}
      <section className="relative px-5 pt-16 pb-24 sm:pt-24">
        {/* dotted warm backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--grid-dot) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(ellipse 75% 70% at 50% 30%, black 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 30%, black 30%, transparent 100%)',
          }}
        />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          {/* Left: message */}
          <div className="text-center lg:text-left">
            <div className="fade-up fade-up-1 chip inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                 style={{ background: 'var(--accent-weak)', color: 'var(--accent)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-status" style={{ background: 'var(--accent)' }} />
              <span className="text-[10px]">Live on X Layer · Agent #6282</span>
            </div>

            <h1 className="fade-up fade-up-2 font-display font-extrabold tracking-tight leading-[1.02] text-[2.75rem] sm:text-6xl mb-5"
                style={{ color: 'var(--text)', textWrap: 'balance' }}>
              Hire a human.<br />
              <span className="underline-stroke">Anywhere on Earth.</span>{' '}
              <span className="inline-block animate-float">🌍</span>
            </h1>

            <p className="fade-up fade-up-3 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8"
               style={{ color: 'var(--text-muted)' }}>
              Your AI can read the whole internet — but it can&apos;t walk outside.
              GroundTruth sends a <strong style={{ color: 'var(--text)' }}>real person</strong> to check,
              photograph, and verify the physical world. Settled on-chain in seconds.
            </p>

            <div className="fade-up fade-up-4 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-9">
              <Link href="/tasks" className="btn btn-primary px-7 py-3.5 text-[15px]">
                Post a task →
              </Link>
              <Link href="/tasks" className="btn btn-ghost px-7 py-3.5 text-[15px]">
                I want to earn
              </Link>
            </div>

            {/* stat chips */}
            <div className="fade-up fade-up-5 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0">
              {[
                { v: '$2', s: 'per task', c: 'var(--accent)' },
                { v: '~8 min', s: 'avg completion', c: 'var(--good)' },
                { v: 'X Layer', s: 'settled on-chain', c: 'var(--info)' },
              ].map(st => (
                <div key={st.s} className="card px-3 py-4 text-center">
                  <div className="font-display text-2xl font-extrabold" style={{ color: st.c }}>{st.v}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{st.s}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: signature globe */}
          <div className="fade-up fade-up-4 flex justify-center lg:justify-end">
            <RealityGlobe />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="px-5 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>How it works</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--text)', textWrap: 'balance' }}>
              From prompt to proof, in five steps
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
            {FLOW.map((n, i) => (
              <div key={n.label} className="flex-1 flex flex-col sm:flex-row items-center">
                <div className="card card-hover w-full sm:w-auto flex-1 p-5 text-center">
                  <div className="text-3xl mb-2">{n.emoji}</div>
                  <div className="font-display font-bold text-sm mb-1" style={{ color: n.c }}>{n.label}</div>
                  <div className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{n.desc}</div>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="hidden sm:block text-xl px-1" style={{ color: 'var(--text-faint)' }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR AI AGENTS ─── */}
      <section className="px-5 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="chip text-[10px] mb-3" style={{ color: 'var(--info)' }}>For AI agents</p>
            <h2 className="font-display text-3xl font-extrabold mb-4" style={{ color: 'var(--text)' }}>
              One MCP endpoint. Three tools.
            </h2>
            <p className="mb-7 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              GroundTruth is registered on OKX.AI as Agent #6282. Any MCP-compatible
              agent discovers and calls it — no custom integration required.
            </p>
            <div className="space-y-3">
              {[
                { tool: 'ground_truth_info', desc: 'Discover pricing & capabilities' },
                { tool: 'human_do', desc: 'Dispatch a real-world task' },
                { tool: 'task_status', desc: 'Poll for completion & proof' },
              ].map(t => (
                <div key={t.tool} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] flex-shrink-0"
                        style={{ background: 'var(--good-weak)', color: 'var(--good)' }}>✓</span>
                  <div>
                    <span className="font-mono text-sm font-semibold" style={{ color: 'var(--info)' }}>{t.tool}</span>
                    <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>— {t.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* code card */}
          <div className="card overflow-hidden font-mono">
            <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--warn)' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--good)' }} />
              <span className="text-xs ml-2" style={{ color: 'var(--text-faint)' }}>mcp-request.json</span>
            </div>
            <div className="p-5 text-[13px] leading-relaxed">
              <div style={{ color: 'var(--text-faint)' }}>{'// POST /api/mcp'}</div>
              <div className="mt-2" style={{ color: 'var(--text)' }}>{'{'}</div>
              <div className="ml-4"><span style={{ color: 'var(--info)' }}>&quot;name&quot;</span><span style={{ color: 'var(--text-muted)' }}>: </span><span style={{ color: 'var(--good)' }}>&quot;human_do&quot;</span><span style={{ color: 'var(--text-muted)' }}>,</span></div>
              <div className="ml-4"><span style={{ color: 'var(--info)' }}>&quot;arguments&quot;</span><span style={{ color: 'var(--text-muted)' }}>: {'{'}</span></div>
              <div className="ml-8"><span style={{ color: 'var(--info)' }}>&quot;intent&quot;</span><span style={{ color: 'var(--text-muted)' }}>: </span><span style={{ color: 'var(--good)' }}>&quot;Photo of the storefront&quot;</span><span style={{ color: 'var(--text-muted)' }}>,</span></div>
              <div className="ml-8"><span style={{ color: 'var(--info)' }}>&quot;budget_usdt&quot;</span><span style={{ color: 'var(--text-muted)' }}>: </span><span style={{ color: 'var(--accent)' }}>&quot;2.00&quot;</span></div>
              <div className="ml-4" style={{ color: 'var(--text-muted)' }}>{'}'}</div>
              <div style={{ color: 'var(--text)' }}>{'}'}</div>
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}>{'// → { task_id, status: "pending" }'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOR ORACLES ─── */}
      <section className="px-5 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="chip text-[10px] mb-3" style={{ color: 'var(--good)' }}>For human oracles</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-3" style={{ color: 'var(--text)', textWrap: 'balance' }}>
              Do a small task. Get paid on the spot.
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              No experience needed. Every mission pays instantly to your wallet in USDT on X Layer.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: '📍', title: 'Claim a mission', desc: 'Browse the board, find one near you, lock it in.' },
              { icon: '📸', title: 'Do it in the world', desc: 'Snap a photo, fill a form, verify a fact on-site.' },
              { icon: '💰', title: 'Get paid on-chain', desc: 'Submit proof, AI verifies, USDT lands in seconds.' },
            ].map(s => (
              <div key={s.title} className="card card-hover p-6">
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-display font-bold mb-2" style={{ color: 'var(--text)' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-9 text-center">
            <Link href="/tasks" className="btn btn-primary px-8 py-3.5">
              View open missions →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t px-5 py-8" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: 'var(--text-faint)' }}>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
              <span className="font-display font-black text-[8px]">GT</span>
            </div>
            <span>GroundTruth · OKX AI Genesis Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Agent #6282</span>
            <span>·</span>
            <span>X Layer chainId 196</span>
            <span>·</span>
            <a href="/api/mcp" className="transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>MCP Endpoint</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
