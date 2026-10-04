export const RETAIL_PLANS = [
  {
    id: 'launch_pilot',
    name: 'Launch pilot',
    priceLabel: '$199 once',
    priceUsd: 199,
    checks: 10,
    timeline: 'one_time_launch',
    description: 'Prove the workflow with one agreed 10-store batch.',
  },
  {
    id: 'monthly_25',
    name: 'Monitor',
    priceLabel: '$249/month',
    priceUsd: 249,
    checks: 10,
    timeline: 'monthly_recurring',
    description: 'Recheck 10 agreed retail locations every month.',
  },
  {
    id: 'monthly_75',
    name: 'Operations',
    priceLabel: '$599/month',
    priceUsd: 599,
    checks: 30,
    timeline: 'monthly_recurring',
    description: 'Track 30 agreed retail locations every month.',
  },
  {
    id: 'unsure',
    name: 'Help me choose',
    priceLabel: 'Scope first',
    priceUsd: null,
    checks: 10,
    timeline: 'recommend_scope',
    description: 'Tell us the decision you need to make; we will recommend the smallest useful scope.',
  },
] as const

export type RetailPlanId = (typeof RETAIL_PLANS)[number]['id']

export function getRetailPlan(id: RetailPlanId) {
  return RETAIL_PLANS.find(plan => plan.id === id) ?? RETAIL_PLANS[0]
}
