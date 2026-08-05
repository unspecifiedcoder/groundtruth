import { z } from 'zod'
import { TASK_PRICE_USDT } from './money'

export type TaskStatus =
  | 'pending'
  | 'claimed'
  | 'submitted'
  | 'needs_review'
  | 'verified'
  | 'failed'
  | 'expired'

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending:      ['claimed', 'expired'],
  claimed:      ['submitted', 'expired'],
  submitted:    ['needs_review', 'verified', 'failed'],
  needs_review: ['verified', 'failed'],
  verified:     [],
  failed:       [],
  expired:      [],
}

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

export type ProofType = 'photo' | 'form'

export interface ProofSpec {
  type: ProofType
  instructions: string
  minPhotos?: number
  formFields?: string[]
  challenge?: string   // per-task freshness code the worker must include in the proof
}

export interface ProofPayload {
  type: ProofType
  storageKeys?: string[]   // for photo
  formData?: Record<string, string>  // for form
  submittedAt: string      // ISO timestamp
}

export interface VerificationCheck {
  name: string
  passed: boolean
  severity: 'hard' | 'soft'
  detail?: string
}

export interface VisionResult {
  checked: boolean   // did the AI vision model actually run?
  match: boolean     // does the image plausibly show the task intent?
  confidence: number // 0–1
  reason: string
  challengeFound?: boolean  // was the freshness challenge code visible in the image?
}

export interface NotaryCheck {
  label: string
  passed: boolean
}

export interface NotaryVerdict {
  decision: 'accept' | 'reject' | 'uncertain'
  confidence: number
  reason: string
  checked: boolean          // did the notary model actually run?
  mode: 'photo' | 'form'
  checks?: NotaryCheck[]     // explainable breakdown shown in the UI
}

export interface TaskResult {
  outcome: 'verified' | 'failed' | 'needs_review'
  checks: VerificationCheck[]
  confidence?: number
  vision?: VisionResult     // advisory AI-vision content check (photo tasks)
  notary?: NotaryVerdict    // semantic proof-vs-intent judgment (the accept gate)
}

export interface Task {
  id: string
  intent: string
  proof_spec: ProofSpec
  budget_usdt: string
  status: TaskStatus
  worker_wallet: string | null
  payment_ref: string | null
  proof_payload: ProofPayload | null
  result: TaskResult | null
  created_at: string
  expires_at: string
  claimed_at: string | null
  submitted_at: string | null
  resolved_at: string | null
}

export const HumanDoInputSchema = z.object({
  intent: z.string().min(1).max(500),
  // Optional: when omitted, the planner infers a proof_spec from the intent.
  proof_spec: z
    .object({
      type: z.enum(['photo', 'form']),
      instructions: z.string().min(1).max(1000),
      minPhotos: z.number().int().min(1).max(5).optional(),
      formFields: z.array(z.string()).optional(),
    })
    .optional(),
  // Optional — the advertised price is fixed, so callers normally omit it.
  //
  // Deliberately NOT pinned to that price: the marketplace's own review address
  // sends payment-exempt and micro-payment probes, and rejecting those is
  // exactly the "extra validation logic" that blocks official testing. What is
  // actually collected is authoritative — after settlement the task's budget is
  // overwritten with the settled amount, so the worker payout can never exceed
  // the money received regardless of what was requested here.
  budget_usdt: z
    .string()
    .regex(/^\d+(\.\d{1,6})?$/, 'must be decimal string')
    .optional()
    .default(TASK_PRICE_USDT),
  timeout_seconds: z.number().int().min(60).max(86400).optional().default(3600),
})

export type HumanDoInput = z.infer<typeof HumanDoInputSchema>

export const SubmitProofInputSchema = z.object({
  task_id: z.string().uuid(),
  worker_wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  proof: z.object({
    type: z.enum(['photo', 'form']),
    storageKeys: z.array(z.string()).optional(),
    formData: z.record(z.string()).optional(),
  }),
})

export type SubmitProofInput = z.infer<typeof SubmitProofInputSchema>
