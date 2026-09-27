import type { Metadata } from 'next'
import Link from 'next/link'
import OperatorForm from './operator-form'

export const metadata: Metadata = {
  title: 'Paid field verification work in Hyderabad',
  description: 'Apply to complete paid retail and location checks for GroundTruth. Clear evidence rules, transparent pay, and no joining fee.',
  alternates: { canonical: '/operators' },
}

export default function OperatorsPage() {
  return <main className="min-h-screen px-5 py-14"><div className="max-w-5xl mx-auto">
    <Link href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>← GroundTruth</Link>
    <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 mt-9">
      <div>
        <p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>Hyderabad launch network</p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-5">Turn local knowledge into paid evidence.</h1>
        <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>GroundTruth sends clearly scoped checks such as confirming a store is open, photographing a shelf display, or recording a displayed price. You choose whether to accept each assignment.</p>
        <div className="card p-5 mt-7 text-sm space-y-3" style={{ color: 'var(--text-muted)' }}>
          <p><strong style={{ color: 'var(--text)' }}>Short check:</strong> ₹180 within 3 km, plus ₹12/km beyond 3 km.</p>
          <p><strong style={{ color: 'var(--text)' }}>Rush premium:</strong> +₹60 when a two-hour assignment is explicitly offered.</p>
          <p><strong style={{ color: 'var(--text)' }}>Detailed audit:</strong> typically ₹250–₹350, shown before acceptance.</p>
          <p><strong style={{ color: 'var(--text)' }}>Payment:</strong> only accepted evidence is payable; the brief states every acceptance rule in advance.</p>
        </div>
        <h2 className="font-display text-xl font-bold mt-8 mb-3">Your safety comes first</h2>
        <ul className="text-sm space-y-2" style={{ color: 'var(--text-muted)' }}>
          <li>• Never trespass, misrepresent yourself, or photograph restricted areas.</li>
          <li>• Leave immediately if staff or bystanders object.</li>
          <li>• Do not purchase anything unless the brief includes reimbursement.</li>
          <li>• No assignment requires an application or onboarding payment.</li>
        </ul>
        <p className="text-xs mt-6 leading-relaxed" style={{ color: 'var(--text-faint)' }}>GroundTruth is initially building density in Madhapur–Kondapur–Gachibowli and Hitech City–Jubilee Hills corridors. Other Hyderabad localities may apply for future coverage.</p>
      </div>
      <OperatorForm />
    </div>
  </div></main>
}
