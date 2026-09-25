export const DEMO_CAMPAIGN = {
  id: 'demo',
  name: '100-store shelf availability pilot',
  customer_name: 'Example Consumer Brand',
  brief: 'Verify availability, shelf price, promotion, and display quality for Sparkling Water 330ml.',
  status: 'active',
  budget_per_task_usdt: '12.00',
  created_at: '2026-09-25T09:00:00.000Z',
  expires_at: '2026-09-28T09:00:00.000Z',
}

export const DEMO_TASKS = [
  { id: 'demo-1', store: 'Central Market · Indiranagar', sku: 'Sparkling Water 330ml', status: 'verified', price: '₹89', availability: 'In stock', distance: '18m', confidence: 0.96 },
  { id: 'demo-2', store: 'FreshMart · Koramangala', sku: 'Sparkling Water 330ml', status: 'verified', price: '₹85', availability: 'In stock', distance: '31m', confidence: 0.94 },
  { id: 'demo-3', store: 'Daily Basket · HSR Layout', sku: 'Sparkling Water 330ml', status: 'claimed', price: null, availability: null, distance: null, confidence: null },
  { id: 'demo-4', store: 'Value Store · Domlur', sku: 'Sparkling Water 330ml', status: 'submitted', price: '₸92', availability: 'In stock', distance: '44m', confidence: null },
  { id: 'demo-5', store: 'Green Grocer · Bellandur', sku: 'Sparkling Water 330ml', status: 'pending', price: null, availability: null, distance: null, confidence: null },
  { id: 'demo-6', store: 'City Hyper · Whitefield', sku: 'Sparkling Water 330ml', status: 'verified', price: '₸88', availability: 'Low stock', distance: '22m', confidence: 0.91 },
  { id: 'demo-7', store: 'Neighbourhood Mart · Jayanagar', sku: 'Sparkling Water 330ml', status: 'failed', price: null, availability: null, distance: '1.8km', confidence: 0.98 },
  { id: 'demo-8', store: 'Metro Foods · MG Road', sku: 'Sparkling Water 330ml', status: 'verified', price: '₸90', availability: 'In stock', distance: '12m', confidence: 0.97 },
]
