import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Investor and partner diligence',
  description: 'GroundTruth product stage, deployed controls, technical evidence, and explicitly unproven assumptions.',
  alternates: { canonical: '/diligence' },
}

const shipped = [
  'Live API and MCP endpoint with machine-readable discovery',
  'Wallet-signed worker sessions and bounded task exposure',
  'Private evidence storage with time-limited reviewer access',
  'Location, freshness, decode, duplicate, and semantic checks',
  'Manual review and idempotent contract settlement controls',
  'Private operations metrics, audit events, and campaign controls',
]

const unproven = [
  'Repeatable paid demand from consumer brands',
  'Reliable worker density outside a focused launch geography',
  'Gross margin after acquisition, review, fraud, and support costs',
  'Enterprise procurement, legal, and data-retention acceptance',
  'Defensibility from reputation data and operating density',
]

export default function DiligencePage() {
  return <main className="min-h-screen px-5 py-14" style={{ color: 'var(--text)' }}><div className="max-w-5xl mx-auto">
    <p className="chip text-[10px] mb-4" style={{ color: 'var(--info)' }}>Diligence room · public beta</p>
    <h1 className="font-display text-4xl sm:text-5xl font-extrabold max-w-3xl">What is built, what is measured, and what remains unproven.</h1>
    <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>GroundTruth is a deployed production pilot for verified retail field evidence. It is not represented as a scaled marketplace or validated customer business.</p>
    <div className="grid md:grid-cols-2 gap-5 mt-10"><section className="card p-6"><h2 className="font-display text-2xl font-bold mb-4">Deployed and testable</h2><div className="space-y-3">{shipped.map(item => <p key={item} className="flex gap-3 text-sm"><span style={{ color: 'var(--good)' }}>✓</span>{item}</p>)}</div></section><section className="card p-6"><h2 className="font-display text-2xl font-bold mb-4">Still requires market evidence</h2><div className="space-y-3">{unproven.map(item => <p key={item} className="flex gap-3 text-sm"><span style={{ color: 'var(--warn)' }}>○</span>{item}</p>)}</div></section></div>
    <section className="card p-7 mt-6"><h2 className="font-display text-2xl font-bold">Evidence available now</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5"><Link className="btn btn-ghost px-4 py-3 text-sm" href="/campaigns/demo">Interactive demo →</Link><Link className="btn btn-ghost px-4 py-3 text-sm" href="/developers">API documentation →</Link><Link className="btn btn-ghost px-4 py-3 text-sm" href="/trust">Trust model →</Link><a className="btn btn-ghost px-4 py-3 text-sm" href="/api/health">Production health →</a></div></section>
    <section className="mt-10 max-w-3xl"><h2 className="font-display text-3xl font-extrabold">The next investment-grade milestone</h2><p className="mt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>Run a funded 10–25 location campaign with acceptance criteria agreed before launch. Publish completion time, acceptance rate, review cost, payout cost, exceptions, and whether the buyer orders again. Those results—not a larger feature list—determine whether GroundTruth has reached an 8/10 investment case.</p><Link href="/pilot" className="btn btn-primary inline-flex mt-6 px-6 py-3">Scope that pilot →</Link></section>
  </div></main>
}
