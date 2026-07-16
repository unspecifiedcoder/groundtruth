import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GroundTruth',
  description: 'Reality-as-a-Service for AI agents',
  manifest: '/manifest.json',
  themeColor: '#030712',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950">{children}</body>
    </html>
  )
}
