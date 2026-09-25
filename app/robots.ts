import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
  return {
    rules: [{
      userAgent: '*',
      allow: ['/', '/developers', '/trust', '/diligence', '/campaigns/demo'],
      disallow: ['/admin', '/api/', '/campaigns/new', '/receipts/', '/tasks/', '/faucet'],
    }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
