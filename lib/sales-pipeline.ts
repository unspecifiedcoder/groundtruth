export const LEAD_STATUSES = ['new', 'qualified', 'scope_sent', 'payment_pending', 'paid', 'active', 'declined', 'churned'] as const

export type PilotLeadStatus = (typeof LEAD_STATUSES)[number]

export function isPilotLeadStatus(value: unknown): value is PilotLeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value)
}

export const LEAD_STATUS_TRANSITIONS: Record<PilotLeadStatus, readonly PilotLeadStatus[]> = {
  new: ['qualified', 'declined'],
  qualified: ['scope_sent', 'declined'],
  scope_sent: ['payment_pending', 'declined'],
  payment_pending: ['paid', 'active', 'declined'],
  paid: ['active'],
  active: ['active', 'churned'],
  declined: [],
  churned: [],
}

export function canTransitionPilotLead(from: PilotLeadStatus, to: PilotLeadStatus) {
  return LEAD_STATUS_TRANSITIONS[from].includes(to)
}

export function isRecurringCadence(cadence: unknown) {
  return cadence === 'monthly_25' || cadence === 'monthly_75'
}

export type SalesMetricLead = {
  lead_status?: unknown
  cadence?: unknown
  payment_reference?: unknown
  amount_received_usd?: unknown
  recurring_monthly_usd?: unknown
}

export function calculateSalesMetrics(leads: SalesMetricLead[]) {
  const evidenced = leads.filter(lead => typeof lead.payment_reference === 'string' && lead.payment_reference.trim().length > 0)
  const active = evidenced.filter(lead => lead.lead_status === 'active' && isRecurringCadence(lead.cadence) && Number(lead.recurring_monthly_usd) > 0)
  const paidPilots = evidenced.filter(lead => lead.lead_status === 'paid' && !isRecurringCadence(lead.cadence) && Number(lead.amount_received_usd) > 0)
  return {
    total_leads: leads.length,
    qualified_conversations: leads.filter(lead => ['qualified', 'scope_sent', 'payment_pending', 'paid', 'active'].includes(String(lead.lead_status))).length,
    scopes_sent: leads.filter(lead => lead.lead_status === 'scope_sent').length,
    payment_pending: leads.filter(lead => lead.lead_status === 'payment_pending').length,
    paid_pilots: paidPilots.length,
    active_recurring_customers: active.length,
    verified_mrr_usd: Number(active.reduce((sum, lead) => sum + Number(lead.recurring_monthly_usd), 0).toFixed(2)),
    recorded_cash_usd: Number(evidenced.reduce((sum, lead) => sum + Math.max(0, Number(lead.amount_received_usd) || 0), 0).toFixed(2)),
  }
}
