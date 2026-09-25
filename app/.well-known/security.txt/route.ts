export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
  const contact = process.env.SECURITY_CONTACT ?? process.env.NEXT_PUBLIC_CONTACT_URL ?? 'https://x.com/0xBejini'
  return new Response(`Contact: ${contact}\nPolicy: ${base}/trust\nPreferred-Languages: en\nCanonical: ${base}/.well-known/security.txt\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  })
}
