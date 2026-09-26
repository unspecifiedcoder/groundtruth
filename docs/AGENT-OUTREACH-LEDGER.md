# GroundTruth agent customer outreach ledger

Updated: 2026-09-26

## Success definition

Target: five external agents or their operators who explicitly commit to a product evaluation, integration trial, funded-pilot discussion, RFQ, or actual GroundTruth use.

Directory listings, automated acknowledgements, quarantined offers, and vague interest are distribution or leads—not customers.

## Current verified count

**0 / 5 customers**

## Pipeline snapshot

- Qualified/research-qualified prospects: **100** ([full pipeline](./AGENT-PROSPECTS-100.csv))
- New outreach attempts this cycle: **6**
- New responses: **5 automated/structured responses; 0 human-qualified replies**
- New trials or pilots: **0**
- Verified customers: **0**
- Payment-rail caveat: prospects are wallet-enabled through Cardano or Base/Solana ecosystems; native X Layer USDT0 buyer compatibility is not yet verified.

### 2026-09-26 revenue sprint (17:35–18:00 UTC)

- Production conversion release: deployed revision `b5acb05be24f312d7a08facd28897a27b0c84ebd` with a buyer-facing `/try` page, a primary 0.01 USDT0 paid-test CTA, an exact capped-spend agent prompt, and an upgrade path to $2–$50 missions or a managed pilot.
- Independent x402 preflight: SCVD task `task_f6cbf442-9642-45a7-9d3a-5762e95a0d2c` classified the endpoint `ready` but found no Bazaar discovery block and no declared input contract.
- Product repair: added `extensions.bazaar` with HTTP input and JSON output examples/schema, then deployed it. SCVD recheck task `task_b7065dea-68f1-4930-a8ac-cd2e5e2b0a9b` returned `ready`; all nine observed checks passed, including `bazaar-extension`, with no remediation items. The remaining unsigned-offer advisory is optional and does not establish a payment or delivery failure.
- New distribution: registered GroundTruth once on //HERE as `AGENT://WQ9P-PKRZ`, published paid service `SERVICE://M40G-G73X` at 0.01 with explicit X Layer/coverage limitations, and opted into its talent exchange at 2 USDC. Public jobs and opportunities were empty; three visible research bounties were generic test records and were not pursued.
- x402 registry distribution: deployed revision `182190974c31a948ff3dc2a090babdf640711a5a` with `/.well-known/x402-service.json`, then registered the live manifest with true402. Registration returned HTTP 201 and service ID `8a918a49-d6c0-4a2f-aa30-e4bc28834621`; a direct registry lookup returned HTTP 200. Registry reputation correctly starts at zero transactions and zero trust score.
- SIXPERCENT outreach attempt: the advertised agent URL returned HTTP 405 to a standard A2A message. No account was created and no fallback customer workflow was invoked.
- Result: stronger conversion and third-party protocol evidence, two new legitimate marketplace surfaces, zero new qualified conversations, zero trials, zero pilots, and **0 / 5 verified customers**. Marketplace publication and conformance checks are not counted as customers.
- Deployment note: the stored Vercel token returned `Not authorized`; the verified release reached production through the connected repository after a fast-forward push to `master`.
- Decision: use the repaired paid-test surface in a small number of operator conversations. Do not pursue test-only bounties, seller-only agents, or broken A2A cards merely to inflate activity.

### 2026-09-26 targeted agent follow-up (18:04–18:06 UTC)

- Agent Intel was selected for its explicit paid-x402 procurement capability. Its public card advertises the root URL as an A2A JSON-RPC endpoint, but `message/send` returned HTTP 404. No paid $0.75 dossier was purchased.
- HORIZON SHIELD KIRA completed A2A task `7bff2f22-9843-4798-a97f-5b001077d3e7`, but classified the partnership request as a renovation-estimate input and returned a canned audit result. This is an automated capability response, not interest or a commitment.
- DFX real-estate intelligence accepted a structured GroundTruth supply manifest at `/have`, interaction `d9dcfb0b-a8f1-420e-a92d-86be3760f173`, and requested `category`, `coverage`, `record_count`, `freshness`, `provenance`, and `rights`. GroundTruth supplied all six truthfully in a follow-up; interaction `005c1d3a-5b6f-4227-af0a-2c0e232832fb` returned `missing_fields: null` and recorded the manifest for demand/supply matching. DFX does not accept evidence payloads at this version and made no trial or purchase commitment.
- Result: one relevant, fully specified real-estate supply lead; zero human-qualified replies; zero trials; zero purchases; **0 / 5 verified customers**.
- Decision: monitor DFX for a demand match. Do not resend the same manifest, and do not pay Agent Intel merely to manufacture an evaluation.

### 2026-09-26 discovery cycle

- Experiment: build a wallet-enabled prospect pool from public Masumi and Agentic Market registries.
- Result: 100 unique candidates with public API/operator paths; 28 priority A, 26 priority B, 46 priority C.
- Evidence: `docs/AGENT-PROSPECTS-100.csv` and `docs/AGENT-PROSPECTS-100.md`.
- Worked: public registries exposed payment capability, online status or usage, and contact paths.
- Failed/blocked: the local OKX-native discovery runtime could not be refreshed because its official Windows installer currently exits with a PowerShell parser error. No OKX search result was fabricated.
- Decision: begin with ten priority-A operator conversations and verify rail compatibility before offering a paid test.

### 2026-09-26 acquisition heartbeat (17:06–17:13 UTC)

- Production A2A lead intake: **0 leads**.
- Relay task `5a0dd62e-248f-4e91-8bd4-96db5f80dc95`: still `TASK_STATE_WORKING`; latest message remains “Relay has received this and it is being carried. The bridge answers on its own rhythm.” No commitment yet.
- MARS offer `off_21e6a275-6eb2-4d7c-8d2b-9a1566ce8e87`: public offer search returns zero matches, consistent with the prior `QUARANTINED_PENDING_REVIEW` state. No commitment yet.
- New outreach: LUMEN B2B Agent, Agent Reputation, and Piknik.Spot.
- Result: three automated responses, zero qualified conversations, zero trials, zero pilots, and zero verified customers.
- Experiment decision: do not immediately follow up with any of these three. Wait for LUMEN’s human-gated verification; Agent Reputation and Piknik.Spot provided no evaluation intent.

## Contact history

| Channel | Endpoint | Evidence | Classification | Next action |
|---|---|---|---|---|
| iwant.fyi | `https://iwant.fyi/api/a2a` | Listing `de98fc95-b04f-4bd3-a815-d067da2b7b2a` recorded. The agent confirmed matching buyer wants will be forwarded to GroundTruth's A2A endpoint. | Active distribution, not a customer | Wait for a matched buyer; answer concrete questions. Do not resubmit the same offer. |
| MARS Economic Intermediary | `https://mars-economic-agent-gateway.mars-economic.workers.dev/a2a` | Offer `off_21e6a275-6eb2-4d7c-8d2b-9a1566ce8e87` accepted into `QUARANTINED_PENDING_REVIEW`; 2026-09-26 public offer search returned zero matches. | Qualified marketplace lead, not a customer | Check for a human-review decision; do not claim acceptance. |
| Agoragentic | Public A2A endpoint | Federation proposal returned `federation identity wiring not enabled`. | Blocked | Do not retry unless its capability changes. |
| aicomglobal | Public A2A endpoint | Registration handle appears reserved, but no recoverable API key was retained. | Blocked | Do not create another account or claim access. |
| Relay | `https://relay2--5de8b3b2995311f1a5481607ee4eb77e.web.val.run/` | Human-review task `5a0dd62e-248f-4e91-8bd4-96db5f80dc95` remains `TASK_STATE_WORKING` as of 2026-09-26 17:06 UTC; Relay says it is being carried. | Warm lead, not yet a customer | Monitor the existing task and answer the human's questions. |
| Direct Hire | Public directory and A2A discovery | GroundTruth is discoverable as external agent `fdb0054f-d969-4847-8e8b-340317fd5e04`. | Active distribution, not a customer | Contact only relevant public buyer profiles; do not duplicate-register. |
| Global A2A Registry | Public registry API | GroundTruth package `app.vercel.groundtruth_field_evidence_agent` is public and queryable. | Active distribution, not a customer | Keep the agent card healthy; do not count searches as demand. |
| OKX.AI | `https://www.okx.ai/agents/6282` | GroundTruth ASP `#6282` is online. The profile shows `Total Sold 24`, while service metadata shows `salesCount: 0` and zero reviews. | Ambiguous platform usage, not verified customers | Do not claim 24 customers. Repair the local client/preflight version mismatch before marketplace actions. |
| Packrift | Public A2A endpoint | Returned static procurement routing and policy information without evaluation or trial intent. | No lead | No follow-up without new relevance. |
| A2A402 | Public marketplace/A2A endpoint | Open-job searches for retail and evidence verification returned no matches; the agent returned generic marketplace information. | No lead | Recheck later; do not register or spend without a concrete match. |
| GAIP Opportunity Broker | Public bounded route | Requests produced retained receipts but remained blocked with `SUPPORTED_SPECIALIST_TASK_KIND_REQUIRED`. | No lead | Do not retry without a supported task schema. |
| A2G Marketplace | Public catalog/discovery | No public listings matched human retail or real-world verification. | No lead | Recheck later; no account created. |
| LUMEN B2B Agent | `https://lumen-zero-a2a.lumen-b2b.workers.dev/a2a/v1` | 2026-09-26 task `7d88caec-f710-4cc7-95a6-2a5a45614e75`; exact response: “LUMEN received the non-binding B2B message…”, `queuedForVerification: true`, while `lumenAutonomousSpend: false` and binding actions are human-gated. | Automated acknowledgement / pending human verification; not a customer | Wait for a substantive human-gated response. Do not send a quote or paid request without an explicit use case. |
| Agent Reputation | `https://agentreputation.dev/api/a2a` | 2026-09-26 feedback `13e42306-db73-4ca6-86c8-888fbbb377f8`; exact response: “Feedback received — every message is read and shapes the roadmap.” | Automated acknowledgement; not a customer | No immediate follow-up. Count only a later substantive evaluation response. |
| Piknik.Spot | `https://piknik.spot/api/a2a` | 2026-09-26 task `e13e5118-fb53-4d12-86af-5e7bf2eca4a4`; exact response only described how to submit a place suggestion with bearer authorization. | Automated capability response / no lead | No follow-up unless the operator provides an evaluation or collaboration path. |
| SCVD Evidence Agent | `https://scvd.store/a2a` | Free preflight tasks `task_f6cbf442-9642-45a7-9d3a-5762e95a0d2c` and `task_b7065dea-68f1-4930-a8ac-cd2e5e2b0a9b`. The recheck returned `ready`, nine passing checks, Bazaar metadata present, and no remediation items. | Independent product evidence, not a customer | Keep the task IDs as evidence. Do not buy its $5 audit without operator approval. |
| //HERE | `https://allherelive.com` | GroundTruth `AGENT://WQ9P-PKRZ`; paid service `SERVICE://M40G-G73X`; talent profile open at 2 USDC. Public jobs/opportunities were empty at registration time. | Active distribution, not a customer | Monitor for a real job or inbound hire; ignore generic test bounties. Do not duplicate-register. |
| true402 | `https://true402.dev/api/v1/services/8a918a49-d6c0-4a2f-aa30-e4bc28834621` | HTTP 201 registration from the production seller manifest; direct HTTP 200 lookup confirms the listing. Registry reports zero transactions, as expected for a new service. | Active x402 distribution, not a customer | Monitor for a distinct external payer and successful settled call; do not count registration or catalog views as demand. |
| SIXPERCENT | `https://api.sixpercent.ai/api` | Standard A2A `message/send` returned HTTP 405 even though the public card advertises this URL. | Relevant real-estate prospect, contact path blocked | Use an operator channel only if one is found; do not create a buyer/seller account merely to pitch. |
| Agent Intel | `https://agent-intel.vectorbuildhq.workers.dev` | Public card says it finds and procures paid x402 resources, but a standard A2A `message/send` to its advertised root returned HTTP 404. | Highly relevant procurement agent, contact path blocked | Do not buy its $0.75 dossier without approval; retry outreach only if its card or transport changes. |
| HORIZON SHIELD KIRA | `https://mcp.horizonshield.dev` | A2A task `7bff2f22-9843-4798-a97f-5b001077d3e7` completed, but the agent treated the partnership proposal as estimate text and returned its standard audit artifact. | Automated capability response; not a lead | No repeat pitch through the estimate skill. Use an operator channel only if available. |
| DFX real-estate intelligence | `https://exchange-production-9123.up.railway.app/have` | Supply manifest recorded in interactions `d9dcfb0b-a8f1-420e-a92d-86be3760f173` and `005c1d3a-5b6f-4227-af0a-2c0e232832fb`; follow-up satisfied all requested fields (`missing_fields: null`). DFX says it matches demand and supply before payload exchange and currently does not accept payloads. | Qualified distribution lead, not a customer | Monitor for a demand match or explicit evaluation. Do not resend the completed manifest. |

## Outreach rules

- Contact only relevant buyer, procurement, retail, commerce, or wallet-enabled agents.
- Never promise a financial return, universal coverage, evidence outcome, or delivery time that has not been scoped.
- Never spend funds, unlock paid leads, accept contractual obligations, or expose credentials.
- Use the live demo, developer guide, A2A card, and service catalog as proof surfaces.
- Record exact responses and count a customer only under the success definition above.
- Stop new outreach once the verified count reaches five; continue only the conversations needed to onboard those five.
