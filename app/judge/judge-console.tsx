'use client'

import { useEffect, useState } from 'react'

type Check = { name: string; detail: string; ok: boolean }

const DEMO_TASK_ID = '00000000-0000-4000-8000-000000042161'

function decodeChallenge(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return JSON.parse(decodeURIComponent(Array.from(atob(padded), char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')))
}

export default function JudgeConsole() {
  const [checks, setChecks] = useState<Check[]>([])
  const [running, setRunning] = useState(true)
  const [ranAt, setRanAt] = useState('')

  async function run() {
    setRunning(true)
    const next: Check[] = []
    try {
      const [healthResponse, manifestResponse, openapiResponse, mcpResponse, a2aResponse, receiptResponse, robinhoodResponse, paymentResponse] = await Promise.all([
        fetch('/api/health', { cache: 'no-store' }),
        fetch('/.well-known/x402-service.json', { cache: 'no-store' }),
        fetch('/api/openapi', { cache: 'no-store' }),
        fetch('/api/mcp', { cache: 'no-store' }),
        fetch('/api/a2a', { cache: 'no-store' }),
        fetch(`/api/v1/receipts/${DEMO_TASK_ID}`, { cache: 'no-store' }),
        fetch('/api/v1/robinhood-demo', { cache: 'no-store' }),
        fetch('/api/v1/human-do', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: 'Hackathon judge compatibility test', service_tier: 'integration_test' }),
        }),
      ])

      const health = await healthResponse.json()
      next.push({ name: 'Production readiness', ok: healthResponse.ok && health.status === 'ready', detail: health.status === 'ready' ? 'Database, evidence storage, migrations, and safety flags are ready.' : `Health returned ${health.status ?? healthResponse.status}.` })

      const manifest = await manifestResponse.json()
      const hasArbitrum = manifest.payment?.rails?.some((rail: { chain?: string }) => rail.chain === 'eip155:42161')
      next.push({ name: '$0.01 product contract', ok: manifestResponse.ok && manifest.pricing?.tiers?.integration_test === '0.01', detail: 'The server-owned integration_test price is 0.01 USDC.' })
      next.push({ name: 'Arbitrum rail advertised', ok: !!hasArbitrum, detail: 'Canonical Arbitrum One USDC is declared in the machine-readable service manifest.' })

      const openapi = await openapiResponse.json()
      next.push({ name: 'OpenAPI', ok: openapiResponse.ok && openapi.openapi === '3.1.0', detail: 'OpenAPI 3.1 contract is publicly readable.' })

      const mcp = await mcpResponse.json()
      next.push({ name: 'MCP', ok: mcpResponse.ok && mcp.protocol === 'mcp', detail: 'Streamable HTTP MCP discovery endpoint is responding.' })

      const a2a = await a2aResponse.json()
      next.push({ name: 'A2A', ok: a2aResponse.ok && a2a.protocol === 'A2A', detail: 'A2A 1.0 discovery and SendMessage endpoint are responding.' })

      const receipt = await receiptResponse.json()
      next.push({ name: 'Arbitrum receipt', ok: receiptResponse.ok && receipt.exists === true && receipt.chainId === 421614, detail: 'The labeled protocol-demo receipt resolves from the Arbitrum Sepolia registry.' })

      const robinhood = await robinhoodResponse.json()
      next.push({ name: 'Robinhood + USDG settlement', ok: robinhoodResponse.ok && robinhood.exists === true && robinhood.chainId === 46630 && robinhood.currency === 'USDG' && robinhood.status === 'settled', detail: robinhoodResponse.ok ? `${robinhood.amount} task funded, receipted, and settled on Robinhood Chain testnet.` : 'Robinhood proof endpoint did not resolve.' })

      const paymentHeader = paymentResponse.headers.get('PAYMENT-REQUIRED')
      const challenge = paymentHeader ? decodeChallenge(paymentHeader) : null
      const arbitrumOffer = challenge?.accepts?.find((offer: { network?: string }) => offer.network === 'eip155:42161')
      next.push({ name: 'Live HTTP 402 challenge', ok: paymentResponse.status === 402 && arbitrumOffer?.amount === '10000', detail: arbitrumOffer ? `Arbitrum One offer: 10,000 atomic USDC = $0.01.` : 'No Arbitrum offer found.' })
    } catch (error) {
      next.push({ name: 'Judge console', ok: false, detail: error instanceof Error ? error.message : 'Live checks failed.' })
    }
    setChecks(next)
    setRanAt(new Date().toLocaleString())
    setRunning(false)
  }

  useEffect(() => { void run() }, [])
  const passed = checks.filter(check => check.ok).length

  return <div>
    <div className="card p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div><h2 className="font-display text-2xl font-extrabold">Live readiness checks</h2><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{running ? 'Testing production…' : `${passed}/${checks.length} checks passed · ${ranAt}`}</p></div>
        <button className="btn btn-primary px-5 py-2.5 disabled:opacity-50" disabled={running} onClick={() => void run()}>{running ? 'Running…' : 'Run again'}</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {checks.map(check => <div className="rounded-xl border p-4" style={{ borderColor: check.ok ? 'var(--good)' : 'var(--warn)' }} key={check.name}>
          <div className="flex items-center gap-2"><span aria-hidden>{check.ok ? '✓' : '!'}</span><strong>{check.name}</strong></div>
          <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--text-muted)' }}>{check.detail}</p>
        </div>)}
      </div>
    </div>
  </div>
}
