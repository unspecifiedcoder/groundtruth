'use client'

import { useState } from 'react'

type StoreRow = { store_name: string; address: string; latitude: number; longitude: number; sku: string }

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"' && quoted && text[i + 1] === '"') { field += '"'; i++; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (char === ',' && !quoted) { row.push(field.trim()); field = ''; continue }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field.trim()); field = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
      continue
    }
    field += char
  }
  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function storesFromCsv(text: string): StoreRow[] {
  const [header, ...rows] = parseCsv(text)
  if (!header) throw new Error('The CSV is empty')
  const names = header.map(value => value.toLowerCase().trim())
  const required = ['store_name', 'address', 'latitude', 'longitude', 'sku']
  const indexes = Object.fromEntries(required.map(name => [name, names.indexOf(name)]))
  const missing = required.filter(name => indexes[name] < 0)
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`)
  return rows.map((values, index) => {
    const latitude = Number(values[indexes.latitude])
    const longitude = Number(values[indexes.longitude])
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error(`Invalid coordinates on row ${index + 2}`)
    return {
      store_name: values[indexes.store_name],
      address: values[indexes.address],
      latitude,
      longitude,
      sku: values[indexes.sku],
    }
  }).filter(row => row.store_name && row.address && row.sku)
}

const SAMPLE = `store_name,address,latitude,longitude,sku\nCentral Market,"100 Main Road, Indiranagar",12.9784,77.6408,Sparkling Water 330ml\nFreshMart,"21 80 Feet Road, Koramangala",12.9352,77.6245,Sparkling Water 330ml`

export default function NewCampaignPage() {
  const [name, setName] = useState('Shelf availability pilot')
  const [customer, setCustomer] = useState('')
  const [brief, setBrief] = useState('Verify availability, current shelf price, promotion, and display quality.')
  const [budget, setBudget] = useState('12.00')
  const [radius, setRadius] = useState('150')
  const [key, setKey] = useState('')
  const [stores, setStores] = useState<StoreRow[]>([])
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [dashboardUrl, setDashboardUrl] = useState('')

  function loadCsv(text: string) {
    try { setStores(storesFromCsv(text)); setError('') } catch (err) { setError(err instanceof Error ? err.message : 'Could not parse CSV') }
  }

  async function createCampaign() {
    if (!stores.length) { setError('Upload at least one valid store row'); return }
    setCreating(true); setError('')
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Pilot-Key': key },
        body: JSON.stringify({
          name,
          customer_name: customer,
          brief,
          budget_per_task_usdt: budget,
          radius_meters: Number(radius),
          stores,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail ?? data.error ?? 'Campaign creation failed')
      setDashboardUrl(data.dashboard_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Campaign creation failed')
    } finally { setCreating(false) }
  }

  return (
    <main className="min-h-screen px-5 py-12" style={{ color: 'var(--text)' }}>
      <div className="max-w-3xl mx-auto">
        <p className="chip text-[10px] mb-3" style={{ color: 'var(--accent)' }}>Pilot operations</p>
        <h1 className="font-display text-4xl font-extrabold mb-3">Create a retail field campaign</h1>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Upload store locations, set the per-store reward, and create location-bound evidence missions in one batch.</p>

        {dashboardUrl ? (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3">✓</div>
            <h2 className="font-display text-2xl font-extrabold mb-2">Campaign created</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Save the dashboard link. It contains the campaign access capability.</p>
            <a href={dashboardUrl} className="btn btn-primary px-7 py-3">Open campaign dashboard →</a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card p-6 grid sm:grid-cols-2 gap-5">
              <label className="text-sm">Campaign name<input value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }} /></label>
              <label className="text-sm">Customer or brand<input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Brand name" className="mt-2 w-full rounded-xl px-4 py-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }} /></label>
              <label className="text-sm sm:col-span-2">Campaign brief<textarea value={brief} onChange={e => setBrief(e.target.value)} rows={3} className="mt-2 w-full rounded-xl px-4 py-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }} /></label>
              <label className="text-sm">Reward per store (USDT)<input value={budget} onChange={e => setBudget(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }} /></label>
              <label className="text-sm">Capture radius (metres)<input value={radius} onChange={e => setRadius(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }} /></label>
            </div>

            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div><h2 className="font-display text-xl font-extrabold">Store list</h2><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Required columns: store_name, address, latitude, longitude, sku.</p></div>
                <div className="flex gap-2"><a href="/sample-retail-campaign.csv" download className="btn btn-ghost px-4 py-2 text-xs">Download template</a><button type="button" onClick={() => loadCsv(SAMPLE)} className="btn btn-ghost px-4 py-2 text-xs">Use sample</button></div>
              </div>
              <input type="file" accept=".csv,text/csv" onChange={e => { const file = e.target.files?.[0]; if (file) file.text().then(loadCsv) }} className="block w-full text-sm" />
              {stores.length > 0 && <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--good-weak)' }}><strong>{stores.length} stores ready</strong><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stores.slice(0, 3).map(store => store.store_name).join(' · ')}{stores.length > 3 ? ` · +${stores.length - 3} more` : ''}</p></div>}
            </div>

            <div className="card p-6">
              <label className="text-sm">Pilot access key<input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="Required to create funded missions" className="mt-2 w-full rounded-xl px-4 py-3 font-mono" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }} /></label>
              <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>Campaign creation is restricted. The key is sent only to the server and is not saved by this page.</p>
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--accent)' }}>⚠ {error}</p>}
            <button type="button" onClick={createCampaign} disabled={creating || !stores.length} className="btn btn-primary w-full py-4 disabled:opacity-40">{creating ? 'Creating campaign…' : `Create ${stores.length || 0} field missions →`}</button>
          </div>
        )}
      </div>
    </main>
  )
}
