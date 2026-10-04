import type { Metadata } from 'next'
import Link from 'next/link'
import JudgeConsole from './judge-console'

export const metadata: Metadata = {
  title: 'Hackathon Judge Console',
  description: 'Verify GroundTruth payment, agent interfaces, Arbitrum receipts, and Robinhood USDG settlement from one page.',
  alternates: { canonical: '/judge' },
}

const payload = `POST https://groundtruth-oracle.vercel.app/api/v1/human-do
Content-Type: application/json

{
  "intent": "Hackathon judge compatibility test",
  "service_tier": "integration_test",
  "proof_spec": {
    "type": "form",
    "instructions": "Return a short integration receipt",
    "formFields": ["result"]
  }
}`

export default function JudgePage() {
  return <main className="min-h-screen px-5 py-14" style={{ color: 'var(--text)' }}>
    <div className="max-w-5xl mx-auto">
      <section className="mb-10">
        <p className="chip text-[10px] mb-3" style={{ color: 'var(--good)' }}>Judge path · no account required</p>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-tight mb-5">Verify the build in under two minutes.</h1>
        <p className="text-lg max-w-3xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>The checks below call production directly. They verify the $0.01 USDC contract, Arbitrum payment offer, agent protocols, production dependencies, the Arbitrum receipt, and a settled USDG task on Robinhood Chain testnet. No payment is made by this console.</p>
      </section>

      <section className="card p-6 mt-8">
        <p className="chip text-[9px] mb-3" style={{ color: 'var(--good)' }}>Robinhood Chain + Paxos USDG</p>
        <h2 className="font-display text-2xl font-extrabold mb-3">One USDG task, funded and settled onchain.</h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>The protocol demonstration uses official Paxos test USDG on Robinhood Chain testnet. Judges can independently inspect funding, a hash-only evidence receipt, and settlement.</p>
        <div className="flex flex-wrap gap-3"><Link href="/robinhood" className="btn btn-primary px-5 py-2.5">Review integration →</Link><a href="/api/v1/robinhood-demo" className="btn btn-ghost px-5 py-2.5">Read machine proof</a></div>
      </section>

      <JudgeConsole />

      <section className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="card p-6">
          <p className="chip text-[9px] mb-3" style={{ color: 'var(--accent)' }}>Optional paid test</p>
          <h2 className="font-display text-2xl font-extrabold mb-3">One cent, exact and capped.</h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>Send this request, read the HTTP 402 challenge, select Arbitrum One USDC, and authorize exactly $0.01. The response is an asynchronous task contract—not a claim that field work happened for one cent.</p>
          <pre className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto" style={{ background: 'var(--bg-subtle)' }}>{payload}</pre>
        </div>
        <div className="card p-6">
          <p className="chip text-[9px] mb-3" style={{ color: 'var(--info)' }}>What is onchain</p>
          <h2 className="font-display text-2xl font-extrabold mb-3">A receipt you can independently inspect.</h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>Task <code>00000000-0000-4000-8000-000000042161</code> is a labeled protocol demonstration. It proves registry deployment and receipt read/write—not customer traction or camera authenticity.</p>
          <div className="flex flex-wrap gap-3"><Link className="btn btn-primary px-5 py-2.5" href="/receipts">Verify receipt</Link><a className="btn btn-ghost px-5 py-2.5" target="_blank" rel="noreferrer" href="https://sepolia.arbiscan.io/tx/0xfed109f5d010f88205e9f2def4ae7bce6a779953eb4c5a73f52dc4ff6c4fd4d8">Open transaction →</a></div>
        </div>
      </section>

      <section className="rounded-xl p-5 mt-8 text-sm leading-relaxed" style={{ background: 'var(--warn-weak)' }}><strong>Trust boundary:</strong> Arbitrum One is the live USDC payment rail. Arbitrum Sepolia is the current receipt registry. Robinhood USDG is a settled testnet protocol demonstration. Testnet transactions are never represented as customer activity or revenue.</section>
    </div>
  </main>
}
