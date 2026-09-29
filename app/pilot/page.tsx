import type { Metadata } from 'next'
import PilotForm from './pilot-form'

export const metadata: Metadata = { title: 'Scope a retail verification pilot or monthly monitor', description: 'Tell GroundTruth the city, retail question, and cadence. We confirm coverage and the evidence checklist before a $199 pilot or recurring plan begins.', alternates: { canonical: '/pilot' } }

export default function PilotPage() {
  return <main className="min-h-screen px-5 py-14"><div className="max-w-5xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-12">
    <div>
      <p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>Launch once · monitor monthly</p>
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-5">Tell us the decision that needs fresh store evidence.</h1>
      <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>Start with a $199 one-time validation, or request a $249/$599 monthly monitoring cadence. We confirm local coverage before you approve any scope or payment.</p>
      <div className="card p-5 mt-7 text-sm space-y-3" style={{ color: 'var(--text-muted)' }}>
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>For every accepted store check, you receive:</h2>
        <p>✓ Original submitted evidence and capture time</p><p>✓ Freshness and location-radius verdicts</p><p>✓ Structured answer for stock, price, promotion, or store status</p><p>✓ Pass, review, or reject reason</p><p>✓ Dashboard plus CSV/API-ready row</p>
      </div>
      <p className="text-xs mt-5 leading-relaxed" style={{ color: 'var(--text-faint)' }}>Standard target is 24 hours after each covered batch is released. Travel outside the agreed zone, purchases, entry fees, rush work, and specialized inspections are scoped separately. Submission is not a purchase or coverage guarantee.</p>
      <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-faint)' }}>Campaign-attributed links record the source, campaign, prospect label, and visit time. These events are not treated as identity, interest, or customer evidence.</p>
    </div>
    <PilotForm />
  </div></main>
}
