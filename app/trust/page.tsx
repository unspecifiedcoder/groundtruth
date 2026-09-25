const PROHIBITED = [
  'Trespass, surveillance, harassment, or photographing private spaces without permission',
  'Purchasing regulated goods, financial transfers, credential sharing, or identity impersonation',
  'Tasks involving minors, medical decisions, law enforcement, weapons, or unsafe physical activity',
  'Deceptive reviews, competitor sabotage, scraping private information, or evading platform controls',
]

export default function TrustPage() {
  return (
    <main className="min-h-screen px-5 py-14" style={{ color: 'var(--text)' }}>
      <div className="max-w-4xl mx-auto">
        <p className="chip text-[10px] mb-3" style={{ color: 'var(--good)' }}>Trust and safety</p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-5">Evidence people can inspect.</h1>
        <p className="text-lg max-w-2xl leading-relaxed mb-12" style={{ color: 'var(--text-muted)' }}>
          GroundTruth is an early pilot product. Verification reduces obvious mismatch and replay risk; it does not turn a field observation into a licensed inspection or an infallible statement of fact.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mb-12">
          <section className="card p-6"><h2 className="font-display text-xl font-extrabold mb-3">What is checked</h2><ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}><li>• Required evidence and structured answers</li><li>• One-time freshness challenge</li><li>• File integrity and duplicate screening</li><li>• Browser-reported distance from the target</li><li>• Semantic match between evidence and brief</li></ul></section>
          <section className="card p-6"><h2 className="font-display text-xl font-extrabold mb-3">What is not guaranteed</h2><ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}><li>• GPS cannot by itself defeat a compromised device</li><li>• AI verification can be uncertain or incorrect</li><li>• Observations can change after capture</li><li>• Operators are not licensed inspectors by default</li><li>• Testnet settlement is not production payment history</li></ul></section>
        </div>

        <section className="mb-12"><h2 className="font-display text-2xl font-extrabold mb-4">Privacy by default</h2><div className="card p-6 text-sm leading-relaxed space-y-3" style={{ color: 'var(--text-muted)' }}><p>Exact worker coordinates are stored with a submission for distance verification but redacted from public task and receipt views. Public receipts show only the location verdict, reported accuracy, and capture time.</p><p>Campaign buyers should request only evidence needed for the stated business purpose. Faces, license plates, payment details, private addresses, and bystanders should be excluded or redacted whenever possible.</p><p>Evidence is stored in a private bucket and accessed through expiring signed URLs. Pilot customers must define an evidence-retention period before production use.</p></div></section>

        <section className="mb-12"><h2 className="font-display text-2xl font-extrabold mb-4">Prohibited tasks</h2><div className="card divide-y" style={{ borderColor: 'var(--border)' }}>{PROHIBITED.map(item => <div key={item} className="p-4 flex gap-3 text-sm"><span style={{ color: 'var(--accent)' }}>×</span><span>{item}</span></div>)}</div></section>

        <section><h2 className="font-display text-2xl font-extrabold mb-4">Disputes and human review</h2><p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>Confident mismatches are rejected. If the verification service is unavailable or the result is uncertain, location-bound photo tasks are held for human review instead of being automatically paid. Pilot disputes should preserve the original files, verification checks, timestamps, and settlement record for manual resolution.</p></section>
      </div>
    </main>
  )
}
