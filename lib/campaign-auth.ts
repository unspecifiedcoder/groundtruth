import { createHash, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'
import { getCampaignWithTasks } from './db'
import { campaignCookieName } from './security'

export function campaignTokenMatches(expectedHash: string, token: string): boolean {
  const actual = createHash('sha256').update(token).digest('hex')
  const a = Buffer.from(expectedHash)
  const b = Buffer.from(actual)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function authorizedForCampaign(req: NextRequest, campaignId: string): Promise<boolean> {
  const token = req.cookies.get(campaignCookieName(campaignId))?.value
  if (!token) return false
  const record = await getCampaignWithTasks(campaignId)
  return !!record && campaignTokenMatches(record.campaign.access_token_hash, token)
}
