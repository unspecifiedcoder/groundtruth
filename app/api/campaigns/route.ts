import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash, randomBytes } from 'crypto'
import { createCampaignWithTasks, getPilotLead, hasCampaignFundingCycle, recordAuditEvent } from '@/lib/db'
import { generateChallenge } from '@/lib/challenge'
import { campaignRewardWithinGuardrail, MAX_CAMPAIGN_REWARD_USDT, MIN_CAMPAIGN_REWARD_USDT } from '@/lib/pilot-economics'
import { constantTimeEqual, rateLimit, sameOrigin } from '@/lib/security'
import { validateCampaignFunding, type CampaignFundingLead } from '@/lib/campaign-funding'

const StoreSchema = z.object({
  store_name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  sku: z.string().min(1).max(200),
})

const CampaignSchema = z.object({
  name: z.string().min(3).max(120),
  customer_name: z.string().min(2).max(120),
  brief: z.string().max(1000).optional().default(''),
  budget_per_task_usdt: z.string().regex(/^\d+(\.\d{1,6})?$/).refine(campaignRewardWithinGuardrail, {
    message: `Standard retail pilot reward must be between ${MIN_CAMPAIGN_REWARD_USDT} and ${MAX_CAMPAIGN_REWARD_USDT} USDT per accepted check`,
  }),
  radius_meters: z.number().int().min(25).max(5000).optional().default(150),
  expires_in_hours: z.number().int().min(1).max(720).optional().default(72),
  stores: z.array(StoreSchema).min(1).max(250),
  pilot_lead_id: z.string().uuid(),
  billing_cycle: z.string().regex(/^(one-time|20\d{2}-(0[1-9]|1[0-2]))$/),
})

function validPilotKey(req: NextRequest): boolean {
  const expected = process.env.PILOT_ACCESS_KEY ?? process.env.ADMIN_SECRET
  const supplied = req.headers.get('x-pilot-key')
  if (!expected || !supplied) return false
  return constantTimeEqual(expected, supplied)
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
  if (await rateLimit(req, 'campaign-create', 6)) return NextResponse.json({ error: 'Too many campaign requests' }, { status: 429 })
  if (!process.env.PILOT_ACCESS_KEY && !process.env.ADMIN_SECRET) return NextResponse.json({ error: 'Campaign creation is not configured' }, { status: 503 })
  if (!validPilotKey(req)) return NextResponse.json({ error: 'Invalid pilot access key' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = CampaignSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid campaign', details: parsed.error.flatten() }, { status: 400 })

  const input = parsed.data
  let lead: Awaited<ReturnType<typeof getPilotLead>>
  try { lead = await getPilotLead(input.pilot_lead_id) } catch { return NextResponse.json({ error: 'Could not verify pilot payment evidence' }, { status: 503 }) }
  if (!lead) return NextResponse.json({ error: 'Paid pilot lead not found' }, { status: 404 })
  const funding = validateCampaignFunding({ lead: lead as CampaignFundingLead, customerName: input.customer_name, taskCount: input.stores.length, rewardUsdt: input.budget_per_task_usdt, billingCycle: input.billing_cycle })
  if (!funding.ok) return NextResponse.json({ error: 'Campaign funding gate failed', detail: funding.reason }, { status: 409 })
  try {
    if (await hasCampaignFundingCycle(input.pilot_lead_id, input.billing_cycle)) return NextResponse.json({ error: 'This paid order cycle already has a campaign' }, { status: 409 })
  } catch { return NextResponse.json({ error: 'Could not verify campaign funding usage' }, { status: 503 }) }
  const accessToken = randomBytes(24).toString('hex')
  const accessTokenHash = createHash('sha256').update(accessToken).digest('hex')
  const expiresAt = new Date(Date.now() + input.expires_in_hours * 60 * 60 * 1000).toISOString()
  const campaignRef = crypto.randomUUID()

  try {
    const campaign = await createCampaignWithTasks({
      campaign: {
        name: input.name,
        customer_name: input.customer_name,
        brief: input.brief,
        access_token_hash: accessTokenHash,
        budget_per_task_usdt: input.budget_per_task_usdt,
        expires_at: expiresAt,
      },
      tasks: input.stores.map((store, index) => ({
        intent: `Verify ${store.sku} availability, shelf price, promotion, and display at ${store.store_name}`,
        proof_spec: {
          type: 'photo',
          instructions: `Visit ${store.store_name} at ${store.address}. Capture the full shelf context and a close view where the product and price are readable. Record the required observations before submitting.`,
          minPhotos: 2,
          formFields: ['availability', 'shelf_price', 'promotion', 'display_notes'],
          challenge: generateChallenge(),
          location: {
            label: `${store.store_name} · ${store.address}`,
            latitude: store.latitude,
            longitude: store.longitude,
            radius_meters: input.radius_meters,
          },
          campaign: { sku: store.sku, store_name: store.store_name },
        },
        budget_usdt: input.budget_per_task_usdt,
        expires_at: expiresAt,
        payment_ref: `campaign-paid:${input.pilot_lead_id}:${input.billing_cycle}:${createHash('sha256').update(funding.paymentReference).digest('hex').slice(0, 16)}:${campaignRef}:${index + 1}`,
      })),
    })

    const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
    await recordAuditEvent({ event_type: 'campaign.created', actor_type: 'buyer', actor_ref: input.customer_name, resource_type: 'campaign', resource_id: campaign.id, metadata: { task_count: input.stores.length, pilot_lead_id: input.pilot_lead_id, billing_cycle: input.billing_cycle, cadence: funding.cadence, amount_received_usd: funding.amountReceivedUsd, worker_reward_reserve_usd: funding.rewardReserveUsd, payment_reference_fingerprint: createHash('sha256').update(funding.paymentReference).digest('hex').slice(0, 16) } }).catch(() => {})
    return NextResponse.json({
      campaign_id: campaign.id,
      task_count: input.stores.length,
      dashboard_url: `${base}/campaigns/${campaign.id}#key=${accessToken}`,
      access_token: accessToken,
      note: 'Save this capability link. The access token is returned only at creation time.',
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json({ error: 'Campaign creation failed', detail: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
