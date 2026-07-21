import type { Metadata } from 'next'
import Link from 'next/link'
import { Bricolage_Grotesque, JetBrains_Mono, Inter } from 'next/font/google'
import './globals.css'
import ThemeToggle from './theme-toggle'

// Bricolage Grotesque — friendly, characterful display face (not the usual
// Inter/Space Grotesk default), keeps "easy for all" while standing out.
const display = Bricolage_Grotesque({
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
  description:
    'AI agents hire human oracles to complete real-world tasks. On-chain proof. Instant USDT payment on X Layer.',
  manifest: '/manifest.json',
}

// Set the saved theme before first paint to avoid a flash. Default: bright.
const themeScript = `(function(){try{var t=localStorage.getItem('gt-theme');document.documentElement.dataset.theme=(t==='dark'||t==='light')?t:'light';}catch(e){document.documentElement.dataset.theme='light';}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${display.variable} ${jetbrainsMono.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className="min-h-screen"
        style={{ fontFamily: 'var(--font-body), Inter, sans-serif' }}
      >
        <nav
          className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
          style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 82%, transparent)' }}
        >
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">

            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:-rotate-6"
                style={{ background: 'var(--accent)', color: 'var(--accent-ink)', boxShadow: 'var(--shadow-accent)' }}
              >
                <span className="font-display font-black text-[13px]">GT</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-extrabold text-[15px] tracking-tight" style={{ color: 'var(--text)' }}>
                  GroundTruth
                </span>
                <span className="font-mono text-[10px] hidden sm:inline" style={{ color: 'var(--text-faint)' }}>
                  ASP #6282
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1.5">
              <div
                className="hidden sm:flex chip items-center gap-1.5 px-2.5 py-1 rounded-full mr-1"
                style={{ background: 'var(--good-weak)', color: 'var(--good)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-status" style={{ background: 'var(--good)' }} />
                <span className="text-[9px]">Network live</span>
              </div>

              {[
                { href: '/tasks', label: 'Tasks' },
                { href: '/pulse', label: 'Pulse' },
                { href: '/faucet', label: 'Faucet' },
              ].map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-1.5 text-sm rounded-lg transition-colors hover:opacity-100"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {l.label}
                </Link>
              ))}

              <ThemeToggle />

              <Link
                href="/tasks"
                className="btn btn-primary ml-1.5 px-4 py-1.5 text-sm"
              >
                Earn USDT →
              </Link>
            </div>
          </div>
        </nav>

        <div className="pt-16">{children}</div>
      </body>
    </html>
  )
}
