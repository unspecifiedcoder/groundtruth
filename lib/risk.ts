export interface WorkerRiskInput {
  completed: number
  failed: number
  activeClaims: number
}

export interface WorkerRiskDecision {
  allowed: boolean
  score: number
  reason: string
}

export function assessWorkerRisk(input: WorkerRiskInput): WorkerRiskDecision {
  const attempts = input.completed + input.failed
  const failureRate = attempts ? input.failed / attempts : 0
  const score = Math.min(100, Math.round(failureRate * 80 + Math.min(input.activeClaims, 4) * 5))

  if (input.activeClaims >= 2) {
    return { allowed: false, score, reason: 'Complete an active mission before claiming another.' }
  }
  if (attempts >= 5 && failureRate >= 0.6) {
    return { allowed: false, score, reason: 'This wallet is temporarily ineligible because too many recent submissions failed verification.' }
  }
  return { allowed: true, score, reason: attempts < 3 ? 'Insufficient history; limited exposure applies.' : 'Worker history is within policy.' }
}
