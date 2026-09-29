# GroundTruth launch-pilot order form

Internal template. Do not send until every bracketed field is completed and the seller's legal and tax details are verified.

## Commercial summary

| Field | Agreed value |
|---|---|
| Quote reference | `[GT-PILOT-YYYY-NNN]` |
| Buyer legal name | `[buyer]` |
| Buyer contact | `[name, title, email]` |
| Seller legal name | `[seller]` |
| Seller address / tax ID | `[verified details]` |
| Launch city and compact zone | `[city and boundaries]` |
| Store checks | 25 accepted checks |
| Retail question | `[stock / shelf price / promotion-display / store open]` |
| Priority SKUs | `[maximum three, or not applicable]` |
| Completion target | Standard 24-hour target after each covered batch is released |
| Pilot price | USD 199 or invoice-currency equivalent agreed in writing |
| Payment timing | Prepaid after scope approval; work is not released before cleared funds and payout reserve |
| Quote expiry | `[date]` |

## Acceptance checklist

An individual store check is accepted only when it contains:

1. original evidence captured inside the assigned session;
2. the required freshness challenge where the brief requires it;
3. capture time and a location-radius verdict;
4. every required structured observation;
5. evidence that visibly supports the answer; and
6. no prohibited personal data, trespass, restricted-area capture, or unsafe conduct.

GroundTruth may reject and reassign a submission that misses the agreed checklist. The buyer receives only accepted results in the 25-check count.

## Deliverables

- private campaign dashboard;
- original accepted evidence, subject to the agreed retention period;
- structured row per location;
- pass, review, or reject reason;
- CSV export and API-ready data; and
- discrepancy-first pilot summary.

## Scope exclusions

Travel outside the agreed zone, mandatory purchases, entry or parking fees, rush work, specialized inspection, private-property access, product handling, and collection of personal data are excluded unless separately written into the quote. Coverage and turnaround are not guaranteed until GroundTruth confirms operator availability.

## Changes, cancellation, and refunds

- Store-list or checklist changes after release may require a revised price and schedule.
- If GroundTruth cannot cover the agreed scope before release, the buyer may accept a revised scope or receive a refund of the uncommitted amount.
- Once a location check has been accepted, its allocated amount is earned and non-refundable except where required by law.
- Rejected evidence is not counted as an accepted check and is reassigned or refunded according to the written resolution.

## Payment control

GroundTruth sends a pro forma invoice or a locked hosted payment link only after scope approval. Payment is confirmed from the bank or payment-provider system of record—not from a screenshot, email, or client-supplied callback. The payment reference must match the quote reference above.

## Approval

Buyer: `[name / title / date / signature or written approval]`

Seller: `[name / title / date / signature or written approval]`

## Internal release gate

Before creating a campaign, the operator must verify all of the following:

- [ ] buyer identity and company are reasonably verified;
- [ ] compact zone and 25 exact locations are agreed;
- [ ] evidence checklist and redo rule are written;
- [ ] safety, privacy, purchases, fees, and retention are agreed;
- [ ] cleared payment is visible in the bank/provider dashboard;
- [ ] quote reference and payment reference match;
- [ ] worker-reward reserve covers the full released batch;
- [ ] active operator coverage is confirmed; and
- [ ] the lead status is moved to `paid` (one-time) or `active` (recurring) only after the preceding checks pass; and
- [ ] the campaign is created with that paid lead ID so the server can revalidate company, plan, cleared amount, payment reference, task count, and worker reserve.
