# GroundTruth Retail Demo

## Fast demo (no database mutation)

1. Open `/campaigns/demo`.
2. Explain the campaign-level metrics and the store-by-store status flow.
3. Open a verified receipt to show structured observations, freshness, location distance, semantic checks, confidence, and payment state.
4. Open the rejected receipt for the Jayanagar store to show that an out-of-radius submission fails instead of being paid.
5. Return to the homepage and show the same workflow exposed through MCP.

The demo campaign is explicitly labeled as illustrative. It must not be described as customer traction.

## Live pilot demo

Prerequisites:

- Apply Supabase migrations through `004_campaigns.sql`.
- Configure `NEXT_PUBLIC_APP_URL`, `ADMIN_SECRET`, Supabase keys, the vision provider, and settlement variables.
- Ensure the `proofs` storage bucket exists and remains private.
- Fund and approve the settlement wallet before promising a worker reward.

Flow:

1. Open `/campaigns/new`.
2. Enter the customer, campaign brief, per-store reward, capture radius, and pilot access key.
3. Upload a CSV with `store_name,address,latitude,longitude,sku`, or choose **Use sample**.
4. Create the campaign and save the capability dashboard URL returned once.
5. Open `/tasks` on a worker phone, claim one mission, and confirm browser location.
6. Capture the freshness code in two photographs and complete the structured observations.
7. Submit. The server persists evidence, verifies location and required fields, runs integrity and semantic checks, and settles an accepted payout.
8. Open the resulting evidence receipt from either the worker completion screen or campaign dashboard.

## Claims to avoid

- Do not claim worldwide coverage or a guaranteed turnaround.
- Do not call prototype activity customer revenue.
- Browser geolocation is a useful signal, not tamper-proof device attestation.
- AI verification evaluates evidence plausibility and task match; it does not guarantee the underlying real-world fact.
- A campaign task is operationally funded only after the settlement wallet is funded and approved.
