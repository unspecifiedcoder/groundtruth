'use client'

import { useEffect, useState } from 'react'
import { getRetailPlan, RETAIL_PLANS, type RetailPlanId } from '@/lib/retail-plans'

const questions = [
  { value: 'stock', label: 'Is the SKU in stock?' },
  { value: 'price', label: 'What shelf price is displayed?' },
  { value: 'promotion', label: 'Is the promotion or display executed?' },
  { value: 'store_open', label: 'Is the store open?' },
  { value: 'other', label: 'Another retail question' },
] as const

const initial = { company_name: '', work_email: '', launch_city: 'Hyderabad', cadence: 'launch_pilot' as RetailPlanId, question_type: 'stock', notes: '', website: '' }
const initialAttribution = { source: 'website', campaign: '', prospect: '' }

export default function PilotForm() {
  const [form, setForm] = useState(initial)
  const [attribution, setAttribution] = useState(initialAttribution)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const field = 'mt-2 w-full rounded-xl px-4 py-3 outline-none'
  const fieldStyle = { background: 'var(--bg-subtle)', border: '1px solid var(--border)' }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nextAttribution = {
      source: params.get('utm_source') || 'website',
      campaign: params.get('utm_campaign') || '',
      prospect: params.get('utm_content') || '',
    }
    setAttribution(nextAttribution)
    if (nextAttribution.source === 'website' && !nextAttribution.campaign && !nextAttribution.prospect) return
    const eventKey = `gt:pilot-landing:${nextAttribution.source}:${nextAttribution.campaign}:${nextAttribution.prospect}`
    if (window.sessionStorage.getItem(eventKey)) return
    window.sessionStorage.setItem(eventKey, '1')
    fetch('/api/funnel-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'pilot_landing', ...nextAttribution }),
      keepalive: true,
    }).catch(() => {})
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const response = await fetch('/api/pilot-leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ...attribution }) })
    const data = await response.json()
    if (!response.ok) setError(data.error ?? 'Submission failed')
    else setReference(data.reference)
    setBusy(false)
  }

  if (reference) {
    const plan = getRetailPlan(form.cadence)
    const nextStep = form.cadence === 'unsure'
      ? 'Next, we will recommend the smallest useful scope after checking the city and evidence requirements.'
      : `Next, we will confirm the city zone, exact acceptance checklist, timing, and a ${plan.priceLabel} proposal.`
    return <div className="card p-8 self-start"><div className="text-4xl mb-3">✓</div><h2 className="font-display text-2xl font-extrabold">Coverage request received</h2><p className="mt-3" style={{ color: 'var(--text-muted)' }}>{nextStep} You are not committed until you approve that scope.</p><p className="font-mono text-xs mt-5" style={{ color: 'var(--text-faint)' }}>Reference {reference}</p></div>
  }

  return <form onSubmit={submit} className="card p-6 sm:p-8 grid sm:grid-cols-2 gap-5">
    <div className="sm:col-span-2 rounded-xl p-4 text-sm" style={{ background: 'var(--good-weak)', color: 'var(--text-muted)' }}><strong style={{ color: 'var(--good)' }}>No charge today.</strong> Choose a one-time validation or the recurring monitoring cadence you actually need.</div>
    <label className="text-sm">Company<input required value={form.company_name} onChange={event => setForm({ ...form, company_name: event.target.value })} className={field} style={fieldStyle} /></label>
    <label className="text-sm">Work email<input required type="email" value={form.work_email} onChange={event => setForm({ ...form, work_email: event.target.value })} className={field} style={fieldStyle} /></label>
    <label className="text-sm sm:col-span-2">Launch city<input required value={form.launch_city} onChange={event => setForm({ ...form, launch_city: event.target.value })} className={field} style={fieldStyle} /></label>
    <fieldset className="sm:col-span-2"><legend className="text-sm mb-2">How often do you need fresh evidence?</legend><div className="grid sm:grid-cols-2 gap-2">{RETAIL_PLANS.map(plan => <label key={plan.id} className="rounded-xl px-4 py-3 flex gap-3 items-start cursor-pointer" style={{ background: form.cadence === plan.id ? 'var(--accent-weak)' : 'var(--bg-subtle)', border: `1px solid ${form.cadence === plan.id ? 'var(--accent)' : 'var(--border)'}` }}><input className="mt-1" type="radio" name="cadence" value={plan.id} checked={form.cadence === plan.id} onChange={() => setForm({ ...form, cadence: plan.id })} /><span><strong className="text-sm">{plan.name} · {plan.priceLabel}</strong><span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{plan.description}</span></span></label>)}</div></fieldset>
    <fieldset className="sm:col-span-2"><legend className="text-sm mb-2">What should we verify?</legend><div className="grid sm:grid-cols-2 gap-2">{questions.map(question => <label key={question.value} className="rounded-xl px-4 py-3 flex gap-3 items-center cursor-pointer" style={{ background: form.question_type === question.value ? 'var(--accent-weak)' : 'var(--bg-subtle)', border: `1px solid ${form.question_type === question.value ? 'var(--accent)' : 'var(--border)'}` }}><input type="radio" name="question_type" value={question.value} checked={form.question_type === question.value} onChange={event => setForm({ ...form, question_type: event.target.value })} /><span className="text-sm font-medium">{question.label}</span></label>)}</div></fieldset>
    <label className="text-sm sm:col-span-2">Optional SKU, retailer, or store-list note<textarea rows={4} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} className={field} style={fieldStyle} placeholder="Example: verify two SKUs across 25 premium grocery stores in Madhapur and Kondapur." /></label>
    <input tabIndex={-1} autoComplete="off" value={form.website} onChange={event => setForm({ ...form, website: event.target.value })} className="hidden" aria-hidden="true" />
    {error && <p className="sm:col-span-2 text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}
    <button disabled={busy} className="btn btn-primary sm:col-span-2 py-3.5 disabled:opacity-40">{busy ? 'Submitting…' : 'Check coverage and scope →'}</button>
    <p className="sm:col-span-2 text-xs text-center" style={{ color: 'var(--text-faint)' }}>No charge today. We first confirm the service zone, evidence checklist, launch timing, and any out-of-scope costs.</p>
  </form>
}
