import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'GroundTruth on Arbitrum',
  description: 'GroundTruth turns fresh physical-world evidence into machine-readable receipts for agents and onchain applications, paid in USDC on Arbitrum One.',
  alternates: { canonical: '/arbitrum' },
}

const USE_CASES = [
  {
    title: 'RWA condition checks',
    problem: 'A token or workflow can represent an asset but cannot observe its present condition.',
    output: 'Fresh, checklist-bound evidence before underwriting, release, or escalation.',
  },
  {
    title: 'DePIN deployment proof',
    problem: 'Coordinates and device telemetry do not independently prove correct physical installation.',
    output: 'Location-bound capture, required angles, structured observations, and a review trail.',
  },
  {
    title: 'Agentic commerce',
    problem: 'An autonomous buyer can query digital inventory but not verify the shelf, price, or display now.',
    output: 'A paid asynchronous field check returned through API, MCP, or A2A.',
  },
]

const FLOW = [
  ['01', 'Request', 'An agent submits one objective physical-state question and an evidence specification.'],
  ['02', 'Pay', 'The endpoint returns HTTP 402; the agent authorizes canonical USDC on Arbitrum One.'],
  ['03', 'Dispatch', 'GroundTruth exposes only funded work to an eligible operator in a confirmed coverage zone.'],
  ['04', 'Verify', 'Freshness, integrity, location, and evidence-to-brief checks produce an explainable verdict.'],
  ['05', 'Consume', 'The agent polls a machine-readable receipt and can preserve its evidence trail downstream.'],
]

export default function ArbitrumPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'

  return (
    <main className="overflow-hidden" style={{ color: 'var(--text)' }}>
      <section className="relative px-5 py-16 sm:py-24">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, var(--grid-dot) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          maskImage: 'radial-gradient(ellipse 75% 75% at 50% 30%, black 25%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 75% at 50% 30%, black 25%, transparent 100%)',
        }} />
        <div className="relative max-w-5xl mx-auto">
          <div className="chip text-[10px] mb-5 px-3 py-1.5" style={{ color: 'var(--info)', background: 'var(--info-weak)' }}>
            Arbitrum One · Agentic finance · Physical-state oracle
          </div>
          <h1 className="font-display font-extrabold tracking-tight leading-[1.02] text-4xl sm:text-6xl max-w-4xl mb-6" style={{ textWrap: 'balance' }}>
            Onchain agents can move money.<br />GroundTruth lets them <span className="underline-stroke">check reality first.</span>
          </h1>
          <p className="text-lg sm:text-xl leading-relaxed max-w-3xl mb-8" style={{ color: 'var(--text-muted)' }}>
            GroundTruth converts an agent request into a funded physical-world mission, screens the returned evidence, and produces a pollable receipt. Calls can be paid with canonical USDC on Arbitrum One through HTTP 402.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/try" className="btn btn-primary px-7 py-3.5">Inspect the paid flow <span className="btn-arrow">→</span></Link>
            <a href="/api/openapi" className="btn btn-ghost px-7 py-3.5">Read the OpenAPI contract</a>
          </div>
          <p className="font-mono text-xs mt-5" style={{ color: 'var(--text-faint)' }}>Live MVP · Arbitrum One payment option · Arbitrum Sepolia receipt registry · asynchronous fulfillment</p>
        </div>
      </section>

      <section className="px-5 py-16 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>The missing primitive</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold max-w-3xl mb-4">Smart contracts verify signatures. They cannot see a shelf, building, device, or parcel.</h2>
          <p className="max-w-3xl leading-relaxed mb-9" style={{ color: 'var(--text-muted)' }}>GroundTruth is not another web-search oracle. It is an execution layer for questions whose answer exists only in the present physical world.</p>
          <div className="grid md:grid-cols-3 gap-5">
            {USE_CASES.map(item => (
              <article key={item.title} className="card p-6">
                <h3 className="font-display text-xl font-extrabold mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>{item.problem}</p>
                <p className="text-sm leading-relaxed font-semibold">{item.output}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
          <div>
            <p className="chip text-[10px] mb-3" style={{ color: 'var(--good)' }}>One request, auditable lifecycle</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-7">From USDC authorization to evidence receipt.</h2>
            <div className="space-y-5">
              {FLOW.map(([number, title, description]) => (
                <div key={number} className="flex gap-4">
                  <span className="font-mono text-xs pt-1" style={{ color: 'var(--accent)' }}>{number}</span>
                  <div><h3 className="font-display font-bold">{title}</h3><p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="ticket self-start">
            <div className="ticket-head"><span>Arbitrum payment contract</span><span>x402 v2</span></div>
            <pre className="ticket-body text-xs leading-relaxed font-mono overflow-x-auto">{`POST /api/v1/human-do
Content-Type: application/json

{
  "intent": "Verify the deployed unit
  matches asset record RWA-184",
  "service_tier": "photo_visit",
  "proof_spec": {
    "type": "photo",
    "instructions": "Capture serial label,
    installation context, and condition",
    "minPhotos": 3
  }
}

402 → eip155:42161 · USDC
200 → task_id + poll_url`}</pre>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="chip text-[10px] mb-3" style={{ color: 'var(--info)' }}>Built, not hand-waved</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-7">Interfaces a judge or agent can inspect now.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a className="card card-hover p-5" href="/api/v1/human-do"><code className="text-xs">HTTP 402</code><strong className="block mt-2">Live payment challenge</strong></a>
            <a className="card card-hover p-5" href="/.well-known/x402-service.json"><code className="text-xs">JSON</code><strong className="block mt-2">Service manifest</strong></a>
            <a className="card card-hover p-5" href="/.well-known/agent-card.json"><code className="text-xs">A2A 1.0</code><strong className="block mt-2">Agent card</strong></a>
            <a className="card card-hover p-5" href="/api/mcp"><code className="text-xs">MCP</code><strong className="block mt-2">Tool endpoint</strong></a>
          </div>
          <div className="card p-5 mt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div><code className="text-xs">Arbitrum Sepolia · 421614</code><strong className="block mt-2">EvidenceReceiptRegistry</strong><span className="block text-xs font-mono mt-2 break-all" style={{ color: 'var(--text-faint)' }}>0xaf712732bd2c8ef589bb9fff5421ed428e4207e1</span></div>
              <div className="flex flex-wrap gap-2"><a className="btn btn-ghost px-5 py-2.5" href="https://sepolia.arbiscan.io/address/0xaf712732bd2c8ef589bb9fff5421ed428e4207e1" target="_blank" rel="noreferrer">Open explorer →</a><Link className="btn btn-ghost px-5 py-2.5" href="/receipts">Verify receipt</Link></div>
            </div>
          </div>
          <div className="card p-5 mt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div><code className="text-xs">Protocol demo · not customer activity</code><strong className="block mt-2">Verifiable receipt recorded on Arbitrum Sepolia</strong><span className="block text-xs font-mono mt-2 break-all" style={{ color: 'var(--text-faint)' }}>Task 00000000-0000-4000-8000-000000042161</span></div>
              <div className="flex flex-wrap gap-2"><Link className="btn btn-primary px-5 py-2.5" href="/receipts">Verify demo receipt</Link><a className="btn btn-ghost px-5 py-2.5" href="https://sepolia.arbiscan.io/tx/0xfed109f5d010f88205e9f2def4ae7bce6a779953eb4c5a73f52dc4ff6c4fd4d8" target="_blank" rel="noreferrer">Inspect transaction →</a></div>
            </div>
          </div>
          <div className="rounded-xl p-5 mt-7 text-sm leading-relaxed" style={{ background: 'var(--warn-weak)' }}>
            <strong>Current boundary:</strong> the software and payment rails are live, while physical fulfillment remains coverage-gated and launches city by city. GroundTruth does not claim global operator coverage or recurring revenue. The initial operating wedge is compact Hyderabad retail verification.
          </div>
        </div>
      </section>

      <section className="px-5 py-16 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
        <div className="max-w-4xl mx-auto card p-8 sm:p-11">
          <p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>Open House build objective</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4">Make physical evidence composable on Arbitrum.</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>The receipt primitive is live on Arbitrum Sepolia: task specification hash, evidence digest, verification verdict, timestamp, and issuer—without putting private photos or personal data onchain. The next milestone is a security-reviewed Arbitrum One deployment backed by an external paid pilot.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href={`${base}/developers`} className="btn btn-primary px-7 py-3.5">Review the integration <span className="btn-arrow">→</span></a>
            <a href={`${base}/diligence`} className="btn btn-ghost px-7 py-3.5">Inspect diligence</a>
          </div>
        </div>
      </section>
    </main>
  )
}
