import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '$0.10 paid agent evaluation',
  description: 'Evaluate GroundTruth end to end with a real $0.10 x402 payment in Base USDC or X Layer USDT0, or launch a basic $2 field mission.',
  alternates: { canonical: '/try' },
}

const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'

const prompt = `Use GroundTruth to run an integration test.
Endpoint: ${base}/api/v1/human-do
Method: POST
JSON body: {"intent":"Evaluate GroundTruth's paid task contract and return a product review","service_tier":"evaluation_test","proof_spec":{"type":"form","instructions":"Return a short evaluation receipt","formFields":["result"]}}
Follow the x402 payment challenge. Prefer 0.10 USDC on Base; X Layer USDT0 is also accepted. Spend no more than $0.10. Return the task_id and poll_url. Do not claim that a physical field visit occurred. For a real basic field mission, use service_tier quick_check at $2.`

export default function TryPage() {
  return (
    <main className="min-h-screen px-5 py-14" style={{ color: 'var(--text)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Offer',
          name: 'GroundTruth paid agent evaluation',
          price: '0.10',
          priceCurrency: 'USDC',
          url: `${base}/try`,
          availability: 'https://schema.org/InStock',
        }).replace(/</g, '\\u003c') }}
      />

      <div className="max-w-5xl mx-auto">
        <section className="grid lg:grid-cols-[1fr_0.9fr] gap-10 items-start mb-16">
          <div>
            <p className="chip text-[10px] mb-3" style={{ color: 'var(--good)' }}>Paid agent evaluation · $0.10 USDC or USDT0</p>
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-tight mb-5">
              Find out if your agent can buy real-world evidence.
            </h1>
            <p className="text-lg leading-relaxed mb-7" style={{ color: 'var(--text-muted)' }}>
              One micro-payment tests discovery, payment, task creation, and polling. It returns a real task ID without pretending a physical visit happened.
            </p>
            <div className="flex flex-wrap gap-3">
              <a className="btn btn-primary px-6 py-3" href={`${base}/api/openapi`}>Open the API contract</a>
              <Link className="btn btn-ghost px-6 py-3" href="/developers">Read integration docs</Link>
            </div>
          </div>

          <div className="card p-6">
            <p className="chip text-[9px] mb-3" style={{ color: 'var(--accent)' }}>What the test proves</p>
            <div className="space-y-4 text-sm">
              {[
                ['1', 'Discover', 'Your agent reaches the live endpoint and reads the machine-priced challenge.'],
                ['2', 'Pay', 'It authorizes exactly $0.10 in Base USDC or X Layer USDT0.'],
                ['3', 'Create', 'GroundTruth returns a real task ID and poll URL.'],
                ['4', 'Inspect', 'You verify the asynchronous status and evidence contract.'],
              ].map(([number, title, body]) => (
                <div className="flex gap-3" key={number}>
                  <span className="font-mono" style={{ color: 'var(--accent)' }}>{number}</span>
                  <div><strong>{title}</strong><p className="mt-1" style={{ color: 'var(--text-muted)' }}>{body}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-8 mb-14">
          <div>
            <p className="chip text-[10px] mb-3" style={{ color: 'var(--info)' }}>Fastest path</p>
            <h2 className="font-display text-3xl font-extrabold mb-3">Hand this request to your agent.</h2>
            <p className="leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
              The spending limit is explicit. A compatible wallet agent should stop for approval under its own policy, pay the challenge, and return the created task.
            </p>
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
              Works with Base USDC or X Layer USDT0. GroundTruth never asks for a private key or seed phrase.
            </p>
          </div>
          <div className="card overflow-hidden font-mono">
            <div className="px-5 py-3 border-b text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}>agent prompt</div>
            <pre className="p-5 text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto">{prompt}</pre>
          </div>
        </section>

        <section className="card p-7 sm:p-9 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold">Need actual field evidence?</h2>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Use the $2–$50 mission tiers or scope repeat locations as a managed pilot.</p>
          </div>
          <Link className="btn btn-primary px-6 py-3 whitespace-nowrap" href="/pilot">Scope a paid pilot →</Link>
        </section>
      </div>
    </main>
  )
}
