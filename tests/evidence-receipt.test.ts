import { describe, expect, it } from 'vitest'
import { buildEvidenceReceipt } from '../lib/evidence-receipt'
import type { Task } from '../lib/types'

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    intent: 'Verify shelf state',
    proof_spec: { type: 'form', instructions: 'Record stock', formFields: ['stock'] },
    budget_usdt: '2.00',
    status: 'verified',
    worker_wallet: '0x1111111111111111111111111111111111111111',
    payment_ref: 'x402:eip155:42161:test',
    proof_payload: { type: 'form', formData: { stock: 'yes' }, submittedAt: '2026-10-04T10:00:00.000Z' },
    result: { outcome: 'verified', checks: [{ name: 'schema', passed: true, severity: 'hard' }] },
    created_at: '2026-10-04T09:00:00.000Z',
    expires_at: '2026-10-04T11:00:00.000Z',
    claimed_at: '2026-10-04T09:30:00.000Z',
    submitted_at: '2026-10-04T10:00:00.000Z',
    resolved_at: '2026-10-04T10:01:00.000Z',
    ...overrides,
  }
}

describe('Arbitrum evidence receipt hashing', () => {
  it('is deterministic when object key order changes', () => {
    const first = task()
    const second = task({
      proof_payload: {
        submittedAt: '2026-10-04T10:00:00.000Z',
        formData: { stock: 'yes' },
        type: 'form',
      },
    })
    expect(buildEvidenceReceipt(first)).toEqual(buildEvidenceReceipt(second))
  })

  it('changes the evidence root when evidence changes', () => {
    const first = buildEvidenceReceipt(task())
    const changed = buildEvidenceReceipt(task({
      proof_payload: { type: 'form', formData: { stock: 'no' }, submittedAt: '2026-10-04T10:00:00.000Z' },
    }))
    expect(changed.evidenceRoot).not.toBe(first.evidenceRoot)
    expect(changed.proofSpecHash).toBe(first.proofSpecHash)
  })

  it('changes the verdict hash without changing evidence', () => {
    const first = buildEvidenceReceipt(task())
    const changed = buildEvidenceReceipt(task({
      result: { outcome: 'failed', checks: [{ name: 'schema', passed: false, severity: 'hard' }] },
    }))
    expect(changed.evidenceRoot).toBe(first.evidenceRoot)
    expect(changed.verdictHash).not.toBe(first.verdictHash)
  })
})
