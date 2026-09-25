import type { Metadata } from 'next'

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  if (params.id === 'demo') return {
    title: 'Interactive retail audit demo',
    description: 'Explore a sample GroundTruth campaign with verified store observations and evidence receipts.',
    alternates: { canonical: '/campaigns/demo' },
  }
  return { title: 'Private campaign', robots: { index: false, follow: false, nocache: true } }
}

export default function CampaignLayout({ children }: { children: React.ReactNode }) { return children }
