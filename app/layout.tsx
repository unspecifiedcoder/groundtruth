import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'GroundTruth — Reality-as-a-Service',
  description: 'AI agents hire human oracles to complete real-world tasks. On-chain proof. Instant USDT payment.',
  manifest: '/manifest.json',
  themeColor: '#030712',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#080c10] text-white min-h-screen">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#080c10]/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#00ff88] flex items-center justify-center">
                <span className="text-black font-black text-xs">GT</span>
              </div>
              <span className="font-bold text-sm tracking-tight">GroundTruth</span>
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/tasks" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                Tasks
              </Link>
              <Link href="/pulse" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                Pulse
              </Link>
              <Link href="/faucet" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                Faucet
              </Link>
              <Link href="/tasks" className="ml-2 px-4 py-1.5 text-sm font-semibold bg-[#00ff88] text-black rounded-lg hover:bg-[#00e87a] transition-colors">
                Earn USDT
              </Link>
            </div>
          </div>
        </nav>
        <div className="pt-14">{children}</div>
      </body>
    </html>
  )
}
