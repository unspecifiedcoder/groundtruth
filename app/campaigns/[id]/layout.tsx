import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  if (id === 'demo') return {
    title: 'Interactive retail audit demo',
    description: 'Explore a sample GroundTruth campaign with verified store observations and evidence receipts.',
    alternates: { canonical: '/campaigns/demo' },
  }
  return { title: 'Private campaign', robots: { index: false, follow: false, nocache: true } }
}

export default function CampaignLayout({ children }: { children: React.ReactNode }) { return children }
