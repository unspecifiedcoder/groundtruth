import Link from 'next/link'
import { LogoMark } from './logo'
import LiveNetwork from './live-network'

const OUTPUTS = [
  { title: 'Shelf availability', description: 'Confirm whether a SKU is in stock and capture the exact shelf context.', icon: '▣' },
  { title: 'Price intelligence', description: 'Collect current prices, promotions, and competitor comparisons from the store.', icon: '$' },
  { title: 'Display compliance', description: 'Verify placement, signage, and campaign execution with required photo angles.', icon: '✓' },
]

const CHECKS = [
  'One-time freshness challenge',
  'Timestamped capture session',
  'Duplicate and integrity screening',
  'AI semantic match against the brief',
  'Explainable pass, fail, or review verdict',
]

export default function Home() {
  const contactUrl = '/pilot'

  return (
    <main className="overflow-hidden" style={{ color: 'var(--text)' }}>
      <section className="relative px-5 py-16 sm:py-24">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, var(--grid-dot) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          maskImage: 'radial-gradient(ellipse 75% 70% at 50% 30%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 30%, black 30%, transparent 100%)',
        }} />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="fade-up fade-up-1 chip inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: 'var(--good-weak)', color: 'var(--good)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--good)' }} />
              <span className="text-[10px]">Verified retail field evidence</span>
            </div>

            <h1 className="fade-up fade-up-2 font-display font-extrabold tracking-tight leading-[1.01] text-[2.8rem] sm:text-6xl mb-6" style={{ color: 'var(--text)', textWrap: 'balance' }}>
              Know what is happening<br />
              <span className="underline-stroke">in the store today.</span>
            </h1>

            <p className="fade-up fade-up-3 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8" style={{ color: 'var(--text-muted)' }}>
              GroundTruth dispatches field operators to check stock, prices, and displays.
              Get fresh photographic evidence and structured answers back through API, MCP,
              or a shareable verification receipt.
            </p>

            <div className="fade-up fade-up-4 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-7">
              <a href={contactUrl} className="btn btn-primary px-7 py-3.5 text-[15px]">
                Run a field pilot <span className="btn-arrow">→</span>
              </a>
              <a href="#developers" className="btn btn-ghost px-7 py-3.5 text-[15px]">View the API flow</a>
            </div>

            <Link href="/campaigns/demo" className="fade-up fade-up-5 inline-flex items-center gap-2 text-sm font-bold mb-5" style={{ color: 'var(--info)' }}>
              Explore the interactive demo campaign <span>→</span>
            </Link>

            <p className="font-mono text-xs" style={{ color: 'var(--text-faint)' }}>
              Launching focused pilots · Coverage and turnaround confirmed before dispatch
            </p>
          </div>

          <div className="fade-up fade-up-4 flex justify-center lg:justify-end"><LiveNetwork /></div>
        </div>
      </section>

      <section className="px-5 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-11">
            <p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>The first workflow</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4" style={{ textWrap: 'balance' }}>
              Retail questions that cannot be answered from a database.
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Use GroundTruth when the answer depends on what is physically on a shelf right now.
              One visit can return several structured observations, reducing travel cost while producing evidence your team can audit.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {OUTPUTS.map(output => (
              <div key={output.title} className="card card-hover p-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-lg mb-5" style={{ background: 'var(--accent-weak)', color: 'var(--accent)' }}>{output.icon}</div>
                <h3 className="font-display font-bold text-lg mb-2">{output.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{output.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="chip text-[10px] mb-3" style={{ color: 'var(--good)' }}>Verification is the product</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-5" style={{ textWrap: 'balance' }}>A photo is not proof by itself.</h2>
            <p className="leading-relaxed mb-7" style={{ color: 'var(--text-muted)' }}>
              GroundTruth checks the submission against the original brief and records why it passed. Confident mismatches are rejected; ambiguous evidence is routed for review.
            </p>
            <div className="space-y-3">
              {CHECKS.map(check => (
                <div key={check} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs flex-shrink-0" style={{ background: 'var(--good-weak)', color: 'var(--good)' }}>✓</span>
                  <span className="text-sm font-medium">{check}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ticket">
            <div className="ticket-head"><span>Field campaign</span><span>API · dashboard · MCP</span></div>
            <div className="ticket-body space-y-5">
              {[
                ['01', 'Define', 'Upload locations and a structured evidence checklist.'],
                ['02', 'Dispatch', 'Eligible field operators receive a funded mission.'],
                ['03', 'Verify', 'Freshness, integrity, and semantic checks evaluate the evidence.'],
                ['04', 'Use', 'Receive structured results, proof, and an audit trail.'],
              ].map(([step, title, description]) => (
                <div key={step} className="flex gap-4">
                  <span className="font-mono text-xs pt-1" style={{ color: 'var(--accent)' }}>{step}</span>
                  <div><div className="font-display font-bold">{title}</div><p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="developers" className="px-5 py-20 border-t scroll-mt-20" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="chip text-[10px] mb-3" style={{ color: 'var(--info)' }}>For developers and agents</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4">Physical evidence, called like software.</h2>
            <p className="leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
              Create a funded task, receive its ID immediately, and poll for the verified result. The current prototype supports photo and structured-form evidence, x402 payment, and on-chain settlement.
            </p>
          <div className="flex flex-wrap gap-3">
              <a href="/api/mcp" className="btn btn-primary px-6 py-3">Inspect MCP endpoint</a>
              <Link href="/tasks" className="btn btn-ghost px-6 py-3">Open mission board</Link>
            </div>
          </div>

          <div className="card overflow-hidden font-mono">
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>human_do</span>
              <span className="chip text-[9px]" style={{ color: 'var(--good)' }}>asynchronous</span>
            </div>
            <pre className="p-5 text-[12px] sm:text-[13px] leading-relaxed overflow-x-auto" style={{ color: 'var(--text)' }}>{`{
  "intent": "Check Brand A at Store 42",
  "proof_type": "photo",
  "instructions": "Capture shelf, price and stock",
  "budget_usdt": "12.00"
}

→ { "task_id": "...", "status": "pending" }
→ screened evidence + settlement receipt`}</pre>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto card p-8 sm:p-12 text-center">
          <p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>Design partners</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4" style={{ textWrap: 'balance' }}>Turn your next field audit into an API call.</h2>
          <p className="max-w-2xl mx-auto leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
            We are opening focused pilots for brands and commerce teams with recurring store-level questions. Coverage, pricing, and acceptance criteria are agreed before launch.
          </p>
          <a href={contactUrl} className="btn btn-primary px-8 py-3.5">
            Discuss a pilot <span className="btn-arrow">→</span>
          </a>
        </div>
      </section>

      <footer className="border-t px-5 py-8" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: 'var(--text-faint)' }}>
          <div className="flex items-center gap-2.5"><LogoMark size={22} ground={false} /><span>GroundTruth · Verified field evidence</span></div>
          <div className="flex flex-wrap items-center justify-center gap-4 font-mono"><Link href="/campaigns/demo">Demo</Link><Link href="/developers">Developers</Link><Link href="/trust">Trust</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/acceptable-use">Acceptable use</Link></div>
        </div>
      </footer>
    </main>
  )
}
