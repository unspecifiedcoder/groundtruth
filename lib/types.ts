import { z } from 'zod'

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
}

export interface TaskResult {
  outcome: 'verified' | 'failed' | 'needs_review'
  checks: VerificationCheck[]
  confidence?: number
  vision?: VisionResult   // advisory AI-vision content check (photo tasks)
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
  budget_usdt: z.string().regex(/^\d+(\.\d{1,6})?$/, 'must be decimal string'),
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
