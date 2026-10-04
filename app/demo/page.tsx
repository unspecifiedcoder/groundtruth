import type { Metadata } from 'next'
import DemoExperience from './demo-experience'

export const metadata: Metadata = {
  title: 'Live 90-second demo',
  description: 'See an agent request move from physical uncertainty to a privacy-safe Arbitrum evidence receipt.',
  alternates: { canonical: '/demo' },
}

export default function DemoPage() {
  return <DemoExperience />
}
