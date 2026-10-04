import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ROBINHOOD_RECEIPT_REGISTRY,
  ROBINHOOD_TESTNET_EXPLORER,
  ROBINHOOD_USDG,
  ROBINHOOD_USDG_ESCROW,
} from '@/lib/robinhood-demo'

export const metadata: Metadata = {
  title: 'GroundTruth on Robinhood Chain',
  description: 'A live Robinhood Chain testnet demonstration of USDG-funded physical verification tasks and privacy-preserving evidence receipts.',
  alternates: { canonical: '/robinhood' },
}

const PMF = [
  ['Buyer', 'FMCG brands, distributors, retail agencies, and commerce agents that need store-level truth.'],
  ['First wedge', 'Verify shelf availability, displayed price, promotions, and placement across a defined store list.'],
  ['Repeat motion', 'Run the same evidence specification weekly, by launch, or by promotion window.'],
  ['Output', 'Photo evidence, structured observations, verification verdict, exportable results, and an onchain receipt hash.'],
]

export default function RobinhoodPage() {
  return <main className="min-h-screen overflow-hidden" style={{ color: 'var(--text)' }}>
    <section className="px-5 py-16 sm:py-24 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto">
        <p className="chip text-[10px] mb-4" style={{ color: 'var(--good)' }}>Robinhood Chain testnet · Paxos USDG · verifiable receipts</p>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-[1.02] max-w-4xl mb-6">Physical verification funded in USDG, settled with an auditable result.</h1>
        <p className="text-lg sm:text-xl max-w-3xl leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>GroundTruth turns a retail execution question into a funded task. The Robinhood demonstration escrows official Paxos test USDG, records privacy-preserving evidence hashes, and releases settlement after a verification verdict.</p>
        <div className="flex flex-wrap gap-3"><Link href="/judge" className="btn btn-primary px-6 py-3">Run live judge checks →</Link><a href="/api/v1/robinhood-demo" className="btn btn-ghost px-6 py-3">Read machine proof</a></div>
      </div>
    </section>

    <section className="px-5 py-16" style={{ background: 'var(--bg-subtle)' }}>
      <div className="max-w-5xl mx-auto">
        <p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>Commercial wedge</p>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4">Retail execution is the repeatable job.</h2>
        <p className="max-w-3xl leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>The product is not sold as a generic crowdwork marketplace. It is a recurring evidence layer for teams that must know what is actually happening in stores before allocating trade spend, replenishing stock, or evaluating a promotion.</p>
        <div className="grid sm:grid-cols-2 gap-4">{PMF.map(([title, body]) => <article className="card p-5" key={title}><strong className="font-display text-lg">{title}</strong><p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--text-muted)' }}>{body}</p></article>)}</div>
      </div>
    </section>

    <section className="px-5 py-16 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto">
        <p className="chip text-[10px] mb-3" style={{ color: 'var(--info)' }}>Onchain proof</p>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-7">Not a badge. A settled USDG task.</h2>
        <div className="grid lg:grid-cols-2 gap-5">
          <article className="card p-6"><code className="text-xs">Official Paxos test USDG</code><strong className="block mt-3">Task payment asset</strong><span className="block font-mono text-xs break-all mt-2" style={{ color: 'var(--text-faint)' }}>{ROBINHOOD_USDG}</span><a className="btn btn-ghost mt-5 px-5 py-2.5" href={`${ROBINHOOD_TESTNET_EXPLORER}/tx/0x7484c4b08116443ff373cedd1fe538fd6dea6980da33dcea357c952dd5b50cbf`} target="_blank" rel="noreferrer">Inspect 1 USDG funding →</a></article>
          <article className="card p-6"><code className="text-xs">Chain ID 46630</code><strong className="block mt-3">USDG task escrow</strong><span className="block font-mono text-xs break-all mt-2" style={{ color: 'var(--text-faint)' }}>{ROBINHOOD_USDG_ESCROW}</span><a className="btn btn-ghost mt-5 px-5 py-2.5" href={`${ROBINHOOD_TESTNET_EXPLORER}/address/${ROBINHOOD_USDG_ESCROW}`} target="_blank" rel="noreferrer">Inspect escrow →</a></article>
          <article className="card p-6 lg:col-span-2"><code className="text-xs">Hash-only evidence</code><strong className="block mt-3">Evidence receipt registry</strong><span className="block font-mono text-xs break-all mt-2" style={{ color: 'var(--text-faint)' }}>{ROBINHOOD_RECEIPT_REGISTRY}</span><div className="flex flex-wrap gap-3 mt-5"><a className="btn btn-primary px-5 py-2.5" href={`${ROBINHOOD_TESTNET_EXPLORER}/tx/0xe40962487564871146b878b3398e97f7388a70975e7e885ead9e4dc60e5ba9c1`} target="_blank" rel="noreferrer">Inspect receipt transaction →</a><a className="btn btn-ghost px-5 py-2.5" href={`${ROBINHOOD_TESTNET_EXPLORER}/tx/0x0f055da7c51d942f14dfcb3b224b3f598d7a6ba8a7dd479f77bb49346f00e772`} target="_blank" rel="noreferrer">Inspect settlement →</a></div></article>
        </div>
        <p className="rounded-xl p-5 mt-6 text-sm leading-relaxed" style={{ background: 'var(--warn-weak)' }}><strong>Demonstration boundary:</strong> these are real Robinhood testnet state transitions using valueless test USDG. They prove contract execution and integration, not customer revenue or completed field work.</p>
      </div>
    </section>
  </main>
}
