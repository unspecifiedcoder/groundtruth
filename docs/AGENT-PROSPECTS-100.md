# GroundTruth: 100 wallet-enabled agent prospects

Verified: 2026-09-26

## Outcome

- 100 unique external prospects with a public operator, API, or registry contact path.
- 56 are online Masumi agents advertising Web3 Cardano payments.
- 44 are providers listed in the public Agentic Market x402 catalog.
- 28 are priority A, 26 are priority B, and 46 are priority C.
- 0 were contacted during this research pass.
- 0 are customers or commitments.

The full, sortable pipeline is in `docs/AGENT-PROSPECTS-100.csv`.

## Critical compatibility finding

Every row has evidence of a wallet/payment-enabled ecosystem, but no row has yet been verified as a native X Layer USDT0 buyer. Masumi uses Cardano payment rails, while Agentic Market listings commonly use Base or Solana USDC. GroundTruth must therefore test one of these routes before claiming direct compatibility:

1. A buyer-side multi-chain x402 adapter.
2. A GroundTruth Base/Solana USDC payment option.
3. A cross-rail marketplace or operator-assisted pilot.

Until then, outreach should ask for an integration review or cross-rail trial—not claim that the prospect can pay GroundTruth immediately.

## Best first conversations

| Prospect | Why it is unusually relevant | Smallest credible ask |
|---|---|---|
| Otto AI | Agentic execution plus market intelligence and strong listed usage | Review GroundTruth as a physical-evidence tool for research workflows |
| Apify | Scrapes commerce, maps, travel, and local data but cannot verify the physical shelf | Compare scraped facts with one human-verified store observation |
| Building Manager Agent | Already reasons about physical facilities | Trial one on-site condition or equipment evidence check |
| Fanfare | Uses venue, weather, neighborhood, and travel data | Validate a venue condition, queue, sign, or amenity |
| FlightAware | Real-time travel intelligence still has airport ground-truth gaps | Review an airport signage or disruption-evidence workflow |
| HVAC Diagnostic Agent | A direct digital-to-physical diagnostic complement | Add one human photo/check after an anomaly is detected |
| RentCast | Property data benefits from fresh local evidence | Verify one listing condition or neighborhood claim |
| Tripadvisor | Location content can be stale or manipulated | Test current price, opening, signage, or amenity verification |
| Amadeus | Travel agents need local facts unavailable from booking feeds | Review a destination-level evidence tool call |
| Google Maps Intelligence agents | Digital map data is exactly where fresh physical evidence adds value | Compare one map claim against a timestamped field check |
| Product Reality Check | Strong semantic overlap with GroundTruth | Offer GroundTruth as its physical evidence execution layer |
| Agent Camo | Geo-targeted agent infrastructure | Explore location-aware routing for human evidence tasks |
| PostalForm | Executes a physical-world action from an agent request | Compare fulfillment receipts and physical proof patterns |
| StableMerch | Agentic purchase/fulfillment is a natural verification buyer | Verify delivered merchandise quality or local availability |
| Exa / Browserbase / Firecrawl | Web research agents need a fallback when the web cannot answer | Add a `physical_verify` fallback after low-confidence research |

## Outreach sequence

1. Start with 10 priority-A operators, not all 100.
2. Send a four-sentence message tied to the specific use case in the CSV.
3. Ask for a technical review first; offer the $0.01 paid trial only after payment-rail compatibility is confirmed.
4. Record replies, trials, objections, and integration gaps in the existing outreach ledger.
5. Stop a channel after two batches without meaningful replies and change the message or audience.

## Sources and verification

- [Agentic Market public service API](https://api.agentic.market/v1/services?limit=500): service identity, provider URL, x402 listing, and listed 30-day usage signals.
- [Masumi Registry API documentation](https://registry.masumi.network/docs/): online status, API base URL, payment type, agent pricing, and operator contact fields.
- [x402 Foundation](https://x402.org/): protocol-level evidence that x402 supports programmatic agent payments.

The reproducible discovery script is `scripts/build-agent-prospects.ps1`. It performs read-only registry queries, filters obvious test records, deduplicates candidates, and regenerates the 100-row CSV. Registry content is third-party data and should be rechecked immediately before outreach.
