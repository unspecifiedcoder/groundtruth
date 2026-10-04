import type { Metadata } from 'next'
import PilotForm from './pilot-form'

export const metadata: Metadata = { title: 'Scope a retail verification pilot or monthly monitor', description: 'Tell GroundTruth the city, retail question, and cadence. We confirm coverage and the evidence checklist before a $199 pilot or recurring plan begins.', alternates: { canonical: '/pilot' } }

export default function PilotPage() {
  return <main className="min-h-screen px-5 py-14"><div className="max-w-5xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-12">
    <div>
      <p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>10 stores · one decision · auditable evidence</p>
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-5">Know what is on the shelf before the next decision leaves your system.</h1>
      <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>Start with a fixed $199 launch validation across up to 10 covered Hyderabad stores. Pick one question—stock, displayed price, promotion, placement, or store status—and receive decision-ready evidence. We confirm coverage before you approve scope or payment.</p>
      <div className="card p-5 mt-7 text-sm space-y-3" style={{ color: 'var(--text-muted)' }}>
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>The pilot has an objective finish line:</h2>
        <p>✓ Original submitted evidence and capture time</p><p>✓ Freshness and location-radius verdicts</p><p>✓ Structured answer for stock, price, promotion, or store status</p><p>✓ Pass, review, or reject reason</p><p>✓ Dashboard plus CSV/API-ready row</p>
      </div>
      <div className="card p-5 mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        <h2 className="font-display text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Why a buyer repeats it</h2>
        <p>Turn the same checklist into a $249 monthly monitor for one area, or a $599 multi-area cadence. The recurring product is not more photos—it is the same comparable observation, collected on schedule, with exceptions surfaced before a team or agent acts.</p>
      </div>
      <p className="text-xs mt-5 leading-relaxed" style={{ color: 'var(--text-faint)' }}>Standard target is 24 hours after each covered batch is released. Travel outside the agreed zone, purchases, entry fees, rush work, and specialized inspections are scoped separately. Submission is not a purchase or coverage guarantee.</p>
      <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-faint)' }}>Campaign-attributed links record the source, campaign, prospect label, and visit time. These events are not treated as identity, interest, or customer evidence.</p>
    </div>
    <PilotForm />
  </div></main>
}
