import type { Metadata } from 'next'
import PilotForm from './pilot-form'

export const metadata: Metadata = { title: 'Check coverage for a 25-store retail pilot', description: 'Tell GroundTruth the city and retail question. We confirm coverage and the evidence checklist before you pay for the $199 pilot.', alternates: { canonical: '/pilot' } }

export default function PilotPage() {
  return <main className="min-h-screen px-5 py-14"><div className="max-w-5xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-12">
    <div>
      <p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>25-store launch pilot · $199</p>
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-5">Tell us the city and retail question.</h1>
      <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>We will confirm coverage before you pay. Choose one repeatable question across 25 agreed stores in one compact city zone.</p>
      <div className="card p-5 mt-7 text-sm space-y-3" style={{ color: 'var(--text-muted)' }}>
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>For every accepted store check, you receive:</h2>
        <p>✓ Original submitted evidence and capture time</p><p>✓ Freshness and location-radius verdicts</p><p>✓ Structured answer for stock, price, promotion, or store status</p><p>✓ Pass, review, or reject reason</p><p>✓ Dashboard plus CSV/API-ready row</p>
      </div>
      <p className="text-xs mt-5 leading-relaxed" style={{ color: 'var(--text-faint)' }}>Standard target is 24 hours after each covered batch is released. Travel outside the agreed zone, purchases, entry fees, rush work, and specialized inspections are scoped separately. Submission is not a purchase or coverage guarantee.</p>
    </div>
    <PilotForm />
  </div></main>
}
