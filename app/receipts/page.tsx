import type { Metadata } from 'next'
import ReceiptVerifier from './receipt-verifier'

export const metadata: Metadata = {
  title: 'Arbitrum Evidence Receipt Verifier',
  description: 'Verify a GroundTruth task evidence receipt against its hash-only Arbitrum registry record.',
  alternates: { canonical: '/receipts' },
}

export default function ReceiptsPage() {
  return <main className="min-h-screen px-5 py-16"><div className="max-w-3xl mx-auto">
    <p className="chip text-[10px] mb-3" style={{ color: 'var(--info)' }}>Arbitrum receipt verifier</p>
    <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-5">Verify the evidence trail without exposing the evidence.</h1>
    <p className="text-lg leading-relaxed mb-9" style={{ color: 'var(--text-muted)' }}>GroundTruth anchors hashes of the evidence manifest, proof specification, and verdict. Photos, precise coordinates, and personal data remain offchain and access-controlled.</p>
    <ReceiptVerifier />
    <p className="text-xs leading-relaxed mt-6" style={{ color: 'var(--text-faint)' }}>A matching hash proves that the receipt has not changed since it was recorded. It does not independently prove that a physical observation was correct; review the verification checks and evidence policy for that assessment.</p>
  </div></main>
}
