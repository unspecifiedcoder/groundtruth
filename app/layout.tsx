import type { Metadata } from 'next'
import Link from 'next/link'
import { Space_Grotesk, JetBrains_Mono, Inter } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GroundTruth — Reality-as-a-Service',
  description: 'AI agents hire human oracles to complete real-world tasks. On-chain proof. Instant USDT payment on X Layer.',
  manifest: '/manifest.json',
  themeColor: '#04060A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.variable}`}>
      <body className="bg-[#04060A] text-[#EDF2F7] min-h-screen" style={{ fontFamily: 'var(--font-body), Inter, sans-serif' }}>

        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1C2A3A] bg-[#04060A]/90 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">

            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-8 h-8 rounded-lg bg-[#0DCCFF]/10 border border-[#0DCCFF]/30 flex items-center justify-center">
                <span className="text-[#0DCCFF] font-black text-[11px]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>GT</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-sm text-white tracking-tight" style={{ fontFamily: 'var(--font-display), sans-serif' }}>GroundTruth</span>
                <span className="text-[#3A5269] text-[10px]" style={{ fontFamily: 'var(--font-mono), monospace' }}>ASP #6282</span>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00E87A]/5 border border-[#00E87A]/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E87A] animate-status" />
              <span className="text-[#00E87A] text-[10px] tracking-widest" style={{ fontFamily: 'var(--font-mono), monospace' }}>NETWORK LIVE</span>
            </div>

            <div className="flex items-center gap-1">
              {[{ href: '/tasks', label: 'Tasks' }, { href: '/pulse', label: 'Pulse' }, { href: '/faucet', label: 'Faucet' }].map(l => (
                <Link key={l.href} href={l.href}
                  className="px-3 py-1.5 text-sm text-[#7A9AB5] hover:text-white rounded-lg hover:bg-[#0C1420] transition-all">
                  {l.label}
                </Link>
              ))}
              <Link href="/tasks"
                className="ml-2 px-4 py-1.5 text-sm font-bold bg-[#F5A623] hover:bg-[#FFB93A] text-black rounded-lg transition-all"
                style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                Earn USDT →
              </Link>
            </div>
          </div>
        </nav>

        <div className="pt-14">{children}</div>
      </body>
    </html>
  )
}
