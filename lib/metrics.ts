export type MetricTask = {
  status: string
  budget_usdt: string
  created_at: string
  resolved_at: string | null
  submitted_at: string | null
  result?: { settle?: { payout_usdt?: string; fee_usdt?: string; tx_hash?: string | null } } | null
}

const round = (value: number, places = 1) => Number(value.toFixed(places))

export function calculateOperationsMetrics(tasks: MetricTask[], paymentVolumeUsdt: number) {
  const resolved = tasks.filter(task => task.status === 'verified' || task.status === 'failed')
  const verified = tasks.filter(task => task.status === 'verified')
  const turnaround = verified
    .filter(task => task.resolved_at)
    .map(task => (new Date(task.resolved_at!).getTime() - new Date(task.created_at).getTime()) / 60_000)
    .filter(value => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b)
  const medianMinutes = turnaround.length
    ? turnaround.length % 2
      ? turnaround[(turnaround.length - 1) / 2]
      : (turnaround[turnaround.length / 2 - 1] + turnaround[turnaround.length / 2]) / 2
    : null
  const payoutUsdt = verified.reduce((sum, task) => sum + Number(task.result?.settle?.payout_usdt ?? 0), 0)
  const feeUsdt = verified.reduce((sum, task) => sum + Number(task.result?.settle?.fee_usdt ?? 0), 0)
  const openLiabilityUsdt = tasks
    .filter(task => ['pending', 'claimed', 'submitted', 'needs_review'].includes(task.status))
    .reduce((sum, task) => sum + Number(task.budget_usdt || 0), 0)
  const settlementIssues = verified.filter(task => !task.result?.settle).length

  return {
    total_tasks: tasks.length,
    verified_tasks: verified.length,
    failed_tasks: tasks.filter(task => task.status === 'failed').length,
    awaiting_review: tasks.filter(task => ['submitted', 'needs_review'].includes(task.status)).length,
    in_field: tasks.filter(task => task.status === 'claimed').length,
    acceptance_rate_pct: resolved.length ? round((verified.length / resolved.length) * 100) : null,
    median_turnaround_minutes: medianMinutes === null ? null : round(medianMinutes),
    payment_volume_usdt: round(paymentVolumeUsdt, 6),
    worker_payouts_usdt: round(payoutUsdt, 6),
    recorded_fees_usdt: round(feeUsdt, 6),
    recorded_fee_margin_pct: paymentVolumeUsdt > 0 ? round((feeUsdt / paymentVolumeUsdt) * 100) : null,
    open_reward_liability_usdt: round(openLiabilityUsdt, 6),
    settlement_issues: settlementIssues,
  }
}
