import Link from 'next/link'
import { LogoMark } from './logo'
import { RealityEngine } from './components/visual/reality-engine'

const USE_CASES = [
  { index: '01', eyebrow: 'AGENTIC COMMERCE', title: 'Verify before an agent buys.', description: 'Check present shelf availability, displayed price, or venue state before an autonomous workflow commits capital.' },
  { index: '02', eyebrow: 'RWA + DePIN', title: 'Make physical claims inspectable.', description: 'Turn a field observation into structured evidence and a privacy-preserving, independently verifiable receipt.' },
  { index: '03', eyebrow: 'RETAIL OPERATIONS', title: 'Query a store like an API.', description: 'Dispatch a precise brief for stock, price, promotion, or display compliance and receive an auditable result.' },
]

const PROTOCOLS = ['HTTP 402', 'ARBITRUM USDC', 'MCP', 'A2A', 'OPENAPI 3.1']

export default function Home() {
  return (
    <main className="cinematic-shell">
      <section className="hero-stage" aria-labelledby="hero-title">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-wrap">
          <div className="hero-copy">
            <div className="protocol-kicker reveal reveal-1"><span className="signal-dot" aria-hidden="true" />PHYSICAL ORACLE NETWORK · ARBITRUM</div>
            <h1 id="hero-title" className="hero-title reveal reveal-2">Agents can move money.<span>GroundTruth lets them check reality first.</span></h1>
            <p className="hero-lede reveal reveal-3">Request fresh physical-world evidence, pay through an agent-native rail, and receive a tamper-evident receipt before your software takes an irreversible action.</p>
            <div className="hero-actions reveal reveal-4">
              <Link href="/demo" className="cinematic-button cinematic-button-primary"><span>Run the 90-second demo</span><span className="button-icon" aria-hidden="true">↗</span></Link>
              <Link href="/judge" className="cinematic-button cinematic-button-secondary">Inspect the protocol <span aria-hidden="true">→</span></Link>
            </div>
            <div className="hero-footnote reveal reveal-5"><span>Sponsored sandbox available</span><span className="hero-footnote-separator" aria-hidden="true" /><span>Optional $0.01 USDC integration path</span></div>
          </div>
          <div className="hero-engine reveal reveal-4"><RealityEngine /></div>
        </div>
        <div className="protocol-strip" aria-label="Supported protocols"><span className="protocol-strip-label">ONE REQUEST · DIGITAL TO PHYSICAL</span><div className="protocol-list">{PROTOCOLS.map(protocol => <span key={protocol}>{protocol}</span>)}</div></div>
      </section>

      <section id="how-it-works" className="truth-gap-section scroll-mt-20" aria-labelledby="truth-gap-title">
        <div className="section-frame truth-gap-grid">
          <div><p className="section-index">THE MISSING PRIMITIVE</p><h2 id="truth-gap-title" className="section-title">The internet can tell an agent what was published.<span>The world can tell it what is true now.</span></h2></div>
          <div className="truth-gap-copy"><p>Search, RAG, and APIs observe digital records. GroundTruth is for the moment a workflow depends on a present physical fact: a product is on a shelf, a display exists, or an asset is in the expected condition.</p><Link href="/arbitrum" className="text-link">Why this belongs on Arbitrum <span aria-hidden="true">↗</span></Link></div>
        </div>
      </section>

      <section className="use-case-section" aria-labelledby="use-case-title">
        <div className="section-frame">
          <div className="section-heading-row"><div><p className="section-index">THREE PLACES REALITY BREAKS THE LOOP</p><h2 id="use-case-title" className="section-title section-title-compact">Give software a checkpoint in the physical world.</h2></div><p className="section-side-note">GroundTruth does not claim a photograph is truth. It produces scoped evidence, an explicit verdict, and a hash-linked audit trail.</p></div>
          <div className="use-case-grid">{USE_CASES.map(useCase => <article className="use-case-card" key={useCase.index}><div className="use-case-topline"><span>{useCase.index}</span><span>{useCase.eyebrow}</span></div><h3>{useCase.title}</h3><p>{useCase.description}</p><div className="use-case-signal" aria-hidden="true"><i /><i /><i /></div></article>)}</div>
        </div>
      </section>

      <section className="flow-section" aria-labelledby="flow-title">
        <div className="section-frame">
          <p className="section-index section-index-center">FROM INTENT TO RECEIPT</p><h2 id="flow-title" className="section-title section-title-center">One physical question. One inspectable chain of evidence.</h2>
          <div className="flow-rail">{[
            ['01', 'Request', 'An agent submits a precise physical assumption and proof specification.'],
            ['02', 'Settle', 'A sponsored sandbox or declared USDC rail authorizes the task.'],
            ['03', 'Observe', 'A field submission is checked against the original brief.'],
            ['04', 'Prove', 'Hashes and verdict metadata form a public Arbitrum receipt.'],
          ].map(([number, title, body]) => <article className="flow-step" key={number}><span className="flow-number">{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
          <p className="flow-disclaimer">Demo receipts use Arbitrum Sepolia. The optional payment path uses Arbitrum One USDC. Fulfilment remains asynchronous and subject to confirmed coverage.</p>
        </div>
      </section>

      <section id="pricing" className="final-cta-section scroll-mt-20">
        <div className="final-orbit" aria-hidden="true"><LogoMark size={72} ground={false} /></div>
        <div className="section-frame final-cta-inner"><p className="section-index section-index-center">CROSS THE DIGITAL / PHYSICAL DIVIDE</p><h2>Before your agent acts,<br /><span>let it look.</span></h2><p>Experience the full request-to-receipt loop without needing real funds.</p><div className="hero-actions final-actions"><Link href="/demo" className="cinematic-button cinematic-button-primary">Launch live demo <span aria-hidden="true">↗</span></Link><Link href="/developers" className="cinematic-button cinematic-button-secondary">Read developer docs <span aria-hidden="true">→</span></Link></div></div>
      </section>

      <footer className="cinematic-footer"><div className="section-frame footer-inner"><div className="footer-brand"><LogoMark size={25} ground={false} /><span>GroundTruth</span><small>THE PHYSICAL TRUTH LAYER</small></div><nav aria-label="Footer"><Link href="/demo">Demo</Link><Link href="/judge">Proof</Link><Link href="/developers">Developers</Link><Link href="/receipts">Receipts</Link><Link href="/trust">Trust</Link><Link href="/pilot">Pilot</Link></nav></div></footer>
    </main>
  )
}
