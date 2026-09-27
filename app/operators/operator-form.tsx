'use client'

import { useState } from 'react'

const initial = {
  full_name: '',
  email: '',
  phone: '',
  city: 'Hyderabad',
  locality: '',
  languages: '',
  transport: 'two_wheeler',
  availability: 'flexible',
  experience: '',
  website: '',
}

export default function OperatorForm() {
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const field = 'mt-2 w-full rounded-xl px-4 py-3 outline-none'
  const fieldStyle = { background: 'var(--bg-subtle)', border: '1px solid var(--border)' }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const response = await fetch('/api/operator-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await response.json()
    if (!response.ok) setError(data.error ?? 'Submission failed')
    else setReference(data.reference)
    setBusy(false)
  }

  if (reference) return <div className="card p-8 self-start"><div className="text-4xl mb-3">✓</div><h2 className="font-display text-2xl font-extrabold">Application received</h2><p className="mt-3" style={{ color: 'var(--text-muted)' }}>We will contact you only when your location and availability match a paid pilot. Applying is free and does not guarantee assignments.</p><p className="font-mono text-xs mt-5" style={{ color: 'var(--text-faint)' }}>Reference {reference}</p></div>

  return <form onSubmit={submit} className="card p-6 sm:p-8 grid sm:grid-cols-2 gap-5">
    <div className="sm:col-span-2 rounded-xl p-4 text-sm" style={{ background: 'var(--good-weak)', color: 'var(--text-muted)' }}><strong style={{ color: 'var(--good)' }}>Initial Hyderabad pay:</strong> ₹180 for an accepted short check within 3 km, plus ₹12/km beyond that. Rush and detailed audits pay more.</div>
    <label className="text-sm">Full name<input required value={form.full_name} onChange={event => setForm({ ...form, full_name: event.target.value })} className={field} style={fieldStyle} /></label>
    <label className="text-sm">Email<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className={field} style={fieldStyle} /></label>
    <label className="text-sm">Phone / WhatsApp<input required value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className={field} style={fieldStyle} /></label>
    <label className="text-sm">City<input required value={form.city} onChange={event => setForm({ ...form, city: event.target.value })} className={field} style={fieldStyle} /></label>
    <label className="text-sm sm:col-span-2">Locality / neighborhoods you can cover<input required value={form.locality} onChange={event => setForm({ ...form, locality: event.target.value })} className={field} style={fieldStyle} placeholder="Example: Madhapur, Kondapur, Gachibowli" /></label>
    <label className="text-sm">Languages<input required value={form.languages} onChange={event => setForm({ ...form, languages: event.target.value })} className={field} style={fieldStyle} placeholder="Telugu, Hindi, English" /></label>
    <label className="text-sm">Transport<select value={form.transport} onChange={event => setForm({ ...form, transport: event.target.value })} className={field} style={fieldStyle}><option value="two_wheeler">Two-wheeler</option><option value="bicycle">Bicycle</option><option value="walk_transit">Walk / public transit</option><option value="car">Car</option><option value="other">Other</option></select></label>
    <label className="text-sm sm:col-span-2">Typical availability<select value={form.availability} onChange={event => setForm({ ...form, availability: event.target.value })} className={field} style={fieldStyle}><option value="flexible">Flexible</option><option value="weekdays">Weekdays</option><option value="evenings">Evenings</option><option value="weekends">Weekends</option></select></label>
    <label className="text-sm sm:col-span-2">Relevant experience (optional)<textarea rows={4} value={form.experience} onChange={event => setForm({ ...form, experience: event.target.value })} className={field} style={fieldStyle} placeholder="Retail, delivery, field sales, audits, photography, or local knowledge." /></label>
    <input tabIndex={-1} autoComplete="off" value={form.website} onChange={event => setForm({ ...form, website: event.target.value })} className="hidden" aria-hidden="true" />
    {error && <p className="sm:col-span-2 text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}
    <button disabled={busy} className="btn btn-primary sm:col-span-2 py-3.5 disabled:opacity-40">{busy ? 'Submitting…' : 'Apply for paid field work →'}</button>
    <p className="sm:col-span-2 text-xs text-center" style={{ color: 'var(--text-faint)' }}>No joining fee. Never pay anyone claiming they can guarantee GroundTruth assignments.</p>
  </form>
}
