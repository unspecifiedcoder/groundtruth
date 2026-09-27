import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  if (id === 'demo') return {
    title: 'Illustrative retail audit deliverable',
    description: 'Explore the proposed GroundTruth campaign output contract with illustrative store observations and evidence receipts.',
    alternates: { canonical: '/campaigns/demo' },
  }
  return { title: 'Private campaign', robots: { index: false, follow: false, nocache: true } }
}

export default function CampaignLayout({ children }: { children: React.ReactNode }) { return children }
