import type { Metadata } from 'next'
import Link from 'next/link'
import { Bricolage_Grotesque, JetBrains_Mono, Inter } from 'next/font/google'
import './globals.css'
import ThemeToggle from './theme-toggle'
import { Logo } from './logo'

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

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M20 3.5c-6.35 0-11.5 5.05-11.5 11.28 0 7.9 8.9 15.3 10.86 17.86.34.45.94.45 1.28 0C22.6 30.08 31.5 22.68 31.5 14.78 31.5 8.55 26.35 3.5 20 3.5Z" fill="%23FF5A3C"/><path d="M14.8 15.1l3.6 3.6 6.8-6.9" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'),
  title: {
    default: 'GroundTruth — Verified retail field evidence',
    template: '%s · GroundTruth',
  },
  description:
    'Dispatch retail field checks and receive fresh photographic evidence, structured observations, and an auditable verification receipt.',
  applicationName: 'GroundTruth',
  keywords: ['retail field audit', 'shelf availability', 'price intelligence', 'display compliance', 'field evidence API', 'AI agent tools'],
  alternates: { canonical: '/', types: { 'text/markdown': '/groundtruth.md' } },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'GroundTruth',
    title: 'GroundTruth — Verified retail field evidence',
    description: 'Dispatch real-world retail checks from software and receive verified photographic evidence and structured observations.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'GroundTruth verified field evidence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GroundTruth — Verified retail field evidence',
    description: 'Dispatch real-world retail checks from software.',
    images: ['/opengraph-image'],
  },
  category: 'technology',
  creator: 'GroundTruth',
  manifest: '/manifest.json',
  icons: { icon: `data:image/svg+xml,${faviconSvg}` },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'GroundTruth',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app',
            description: 'An API and MCP service for dispatching verified retail field evidence missions.',
            offers: { '@type': 'Offer', priceCurrency: 'USDT', availability: 'https://schema.org/LimitedAvailability' },
          }).replace(/</g, '\\u003c') }}
        />
        <nav
          className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
          style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 82%, transparent)' }}
        >
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">

            <Link href="/" className="flex items-center gap-2.5 group">
              <Logo size={30} />
              <span className="font-mono text-[10px] hidden sm:inline" style={{ color: 'var(--text-faint)' }}>FIELD EVIDENCE</span>
            </Link>

            <div className="flex items-center gap-1.5">
              <div className="hidden md:flex items-center gap-1">
                {[
                  { href: '/try', label: 'Test $0.01' },
                  { href: '/developers', label: 'Developers' },
                  { href: '/campaigns/demo', label: 'Demo' },
                  { href: '/trust', label: 'Trust' },
                  { href: '/diligence', label: 'Diligence' },
                  { href: '/tasks', label: 'Missions' },
                  { href: '/pulse', label: 'Activity' },
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
              </div>

              <ThemeToggle />

              <a
                href="/try"
                className="btn btn-primary ml-1.5 px-4 py-1.5 text-sm"
              >
                <span className="sm:hidden">Test</span><span className="hidden sm:inline">Run $0.01 test</span> <span className="btn-arrow">→</span>
              </a>
            </div>
          </div>
        </nav>

        <div className="pt-16">{children}</div>
      </body>
    </html>
  )
}
