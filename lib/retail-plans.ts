export const RETAIL_PLANS = [
  {
    id: 'launch_pilot',
    name: 'Launch pilot',
    priceLabel: '$199 once',
    priceUsd: 199,
    checks: 25,
    timeline: 'one_time_launch',
    description: 'Prove the workflow with one agreed 25-store batch.',
  },
  {
    id: 'monthly_25',
    name: 'Monitor',
    priceLabel: '$249/month',
    priceUsd: 249,
    checks: 25,
    timeline: 'monthly_recurring',
    description: 'Recheck 25 agreed retail locations every month.',
  },
  {
    id: 'monthly_75',
    name: 'Operations',
    priceLabel: '$599/month',
    priceUsd: 599,
    checks: 75,
    timeline: 'monthly_recurring',
    description: 'Track 75 agreed retail locations every month.',
  },
  {
    id: 'unsure',
    name: 'Help me choose',
    priceLabel: 'Scope first',
    priceUsd: null,
    checks: 25,
    timeline: 'recommend_scope',
    description: 'Tell us the decision you need to make; we will recommend the smallest useful scope.',
  },
] as const

export type RetailPlanId = (typeof RETAIL_PLANS)[number]['id']

export function getRetailPlan(id: RetailPlanId) {
  return RETAIL_PLANS.find(plan => plan.id === id) ?? RETAIL_PLANS[0]
}
