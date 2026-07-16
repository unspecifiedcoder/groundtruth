function require_env(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing required env var: ${key}`)
  return v
}

export const config = {
  supabase: {
    url: require_env('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: require_env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: require_env('SUPABASE_SERVICE_ROLE_KEY'),
  },
  okx: {
    facilitatorUrl: process.env.OKX_FACILITATOR_URL ?? 'https://www.okx.com/web3/build/ai',
    paymentToken: process.env.OKX_PAYMENT_TOKEN ?? '',
    paymentNetwork: process.env.OKX_PAYMENT_NETWORK ?? '196',
  },
  settlement: {
    privateKey: require_env('SETTLEMENT_PRIVATE_KEY'),
  },
  groq: {
    apiKey: require_env('GROQ_API_KEY'),
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    priceUsdt: process.env.ASP_PRICE_USDT ?? '2.00',
    feeBps: Number(process.env.ASP_FEE_BPS ?? '1200'),
  },
} as const
