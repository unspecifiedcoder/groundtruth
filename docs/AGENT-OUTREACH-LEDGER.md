# GroundTruth agent customer outreach ledger

Updated: 2026-09-26

## Success definition

Target: five external agents or their operators who explicitly commit to a product evaluation, integration trial, funded-pilot discussion, RFQ, or actual GroundTruth use.

Directory listings, automated acknowledgements, quarantined offers, and vague interest are distribution or leads—not customers.

## Current verified count

**0 / 5 customers**

## Contact history

| Channel | Endpoint | Evidence | Classification | Next action |
|---|---|---|---|---|
| iwant.fyi | `https://iwant.fyi/api/a2a` | Listing `de98fc95-b04f-4bd3-a815-d067da2b7b2a` recorded. The agent confirmed matching buyer wants will be forwarded to GroundTruth's A2A endpoint. | Active distribution, not a customer | Wait for a matched buyer; answer concrete questions. Do not resubmit the same offer. |
| MARS Economic Intermediary | `https://mars-economic-agent-gateway.mars-economic.workers.dev/a2a` | Offer `off_21e6a275-6eb2-4d7c-8d2b-9a1566ce8e87` accepted into `QUARANTINED_PENDING_REVIEW`. | Qualified marketplace lead, not a customer | Check for a human-review decision; do not claim acceptance. |
| Agoragentic | Public A2A endpoint | Federation proposal returned `federation identity wiring not enabled`. | Blocked | Do not retry unless its capability changes. |
| aicomglobal | Public A2A endpoint | Registration handle appears reserved, but no recoverable API key was retained. | Blocked | Do not create another account or claim access. |
| Relay | `https://relay2--5de8b3b2995311f1a5481607ee4eb77e.web.val.run/` | Human-review task `5a0dd62e-248f-4e91-8bd4-96db5f80dc95` is `TASK_STATE_WORKING`; Relay says a human will look at it. | Warm lead, not yet a customer | Monitor the existing task and answer the human's questions. |
| Direct Hire | Public directory and A2A discovery | GroundTruth is discoverable as external agent `fdb0054f-d969-4847-8e8b-340317fd5e04`. | Active distribution, not a customer | Contact only relevant public buyer profiles; do not duplicate-register. |
| Global A2A Registry | Public registry API | GroundTruth package `app.vercel.groundtruth_field_evidence_agent` is public and queryable. | Active distribution, not a customer | Keep the agent card healthy; do not count searches as demand. |
| OKX.AI | `https://www.okx.ai/agents/6282` | GroundTruth ASP `#6282` is online. The profile shows `Total Sold 24`, while service metadata shows `salesCount: 0` and zero reviews. | Ambiguous platform usage, not verified customers | Do not claim 24 customers. Repair the local client/preflight version mismatch before marketplace actions. |
| Packrift | Public A2A endpoint | Returned static procurement routing and policy information without evaluation or trial intent. | No lead | No follow-up without new relevance. |
| A2A402 | Public marketplace/A2A endpoint | Open-job searches for retail and evidence verification returned no matches; the agent returned generic marketplace information. | No lead | Recheck later; do not register or spend without a concrete match. |
| GAIP Opportunity Broker | Public bounded route | Requests produced retained receipts but remained blocked with `SUPPORTED_SPECIALIST_TASK_KIND_REQUIRED`. | No lead | Do not retry without a supported task schema. |
| A2G Marketplace | Public catalog/discovery | No public listings matched human retail or real-world verification. | No lead | Recheck later; no account created. |

## Outreach rules

- Contact only relevant buyer, procurement, retail, commerce, or wallet-enabled agents.
- Never promise a financial return, universal coverage, evidence outcome, or delivery time that has not been scoped.
- Never spend funds, unlock paid leads, accept contractual obligations, or expose credentials.
- Use the live demo, developer guide, A2A card, and service catalog as proof surfaces.
- Record exact responses and count a customer only under the success definition above.
- Stop new outreach once the verified count reaches five; continue only the conversations needed to onboard those five.
