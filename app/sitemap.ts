import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
  const now = new Date()
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/developers`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/pilot`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/trust`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/diligence`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/campaigns/demo`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/acceptable-use`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
