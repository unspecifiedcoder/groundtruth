import { TASK_PRICE_TIERS } from '@/lib/money'

const DEFAULT_BASE = 'https://groundtruth-oracle.vercel.app'

export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_BASE
  const common = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    provider: {
      '@type': 'Organization',
      name: 'GroundTruth',
      url: base,
    },
    areaServed: 'Coverage confirmed during human pilot review',
    termsOfService: `${base}/terms`,
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'AI agents, retail operators, brands, and market researchers',
    },
    offers: Object.entries(TASK_PRICE_TIERS)
      .map(([tier, price]) => ({
        '@type': 'Offer',
        name: tier,
        price,
        priceCurrency: 'USDT',
        availability: 'https://schema.org/LimitedAvailability',
      })),
  }
  const services = [
    {
      ...common,
      '@id': `${base}/catalog.jsonl#shelf-availability`,
      name: 'Shelf availability verification',
      serviceType: 'Location-bound retail shelf availability verification',
      description: 'Human field workers verify whether specified products are present at a target retail location and return structured observations with photographic evidence for review.',
      url: `${base}/pilot?service=shelf-availability`,
    },
    {
      ...common,
      '@id': `${base}/catalog.jsonl#price-promotion`,
      name: 'Retail price and promotion verification',
      serviceType: 'In-store price and promotion verification',
      description: 'Human field workers capture current shelf price and promotion observations at specified retail locations, with evidence receipts and human quality review.',
      url: `${base}/pilot?service=price-promotion`,
    },
    {
      ...common,
      '@id': `${base}/catalog.jsonl#display-compliance`,
      name: 'Retail display compliance verification',
      serviceType: 'In-store display and merchandising verification',
      description: 'Human field workers verify specified display, placement, and merchandising conditions at target locations and return structured, auditable evidence.',
      url: `${base}/pilot?service=display-compliance`,
    },
  ]
  return new Response(services.map(service => JSON.stringify(service)).join('\n') + '\n', {
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
