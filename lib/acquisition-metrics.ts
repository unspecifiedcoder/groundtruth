export type AcquisitionLead = { created_at?: unknown; lead_status?: unknown }
export type AttributedLanding = { created_at: string; source?: string; campaign?: string; prospect?: string }

export function calculateAcquisitionMetrics(leads: AcquisitionLead[], landingEvents: AttributedLanding[], nowMs = Date.now()) {
  const newLeads = leads.filter(lead => !lead.lead_status || lead.lead_status === 'new')
  const staleCutoff = nowMs - 24 * 60 * 60 * 1000
  return {
    attributed_landing_events: landingEvents.length,
    recent_attributed_landings: landingEvents.slice(0, 50),
    new_leads_awaiting_response: newLeads.length,
    stale_new_leads: newLeads.filter(lead => {
      const createdAt = new Date(String(lead.created_at)).getTime()
      return Number.isFinite(createdAt) && createdAt < staleCutoff
    }).length,
  }
}
