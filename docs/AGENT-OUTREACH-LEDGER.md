# GroundTruth agent customer outreach ledger

Updated: 2026-09-29

## Success definition

Target: five external agents or their operators who explicitly commit to a product evaluation, integration trial, funded-pilot discussion, RFQ, or actual GroundTruth use.

Directory listings, automated acknowledgements, quarantined offers, and vague interest are distribution or leads—not customers.

## Current verified count

**1 / 5 verified external commitments**

## Pipeline snapshot

- Qualified/research-qualified prospects: **100** ([full pipeline](./AGENT-PROSPECTS-100.csv))
- New outreach attempts this cycle: **14**
- New responses: **1 external marketplace task plus 5 automated/structured responses**
- New trials or pilots: **1 active external evaluation task**
- Verified external commitments: **1**
- Settled external `$2+` tasks: **0**
- Payment-rail status: GroundTruth now accepts canonical Base USDC for the Base-native prospect pool while retaining X Layer USDT0.

### 2026-09-29 production revenue-operations audit

- Restored and verified the private production operations API after rotating its admin credential. The credential is stored only in the git-ignored local environment file; a live authenticated request returned HTTP 200 after the production redeploy.
- Deployed revision `dbc651a6c5d4535f44e5d42eabedc967a8c10053`, adding an authenticated 24-hour payment activity view with payer fingerprint, transaction evidence, task intent, and an explicit warning that recorded settlements are not customer revenue until attribution is verified. Type checking, all 33 automated tests, the local production build, and the Vercel production build passed.
- Production generated the new snapshot at `2026-09-29T04:06:41.74Z`: **0 payments / 0 USDT in the previous 24 hours**, with the most recent recorded payment timestamp at `2026-09-26T17:11:15.189369+05:30`. It also returned **0 leads**, **0 campaigns**, and no telemetry warnings.
- Fixed a launch-blocking unit-economics mismatch in revision `5b197db07d074b74124d89d1f287b1ac515d9e8f`: the internal campaign creator had defaulted to a `$12` worker reward per store, which could reserve `$300` against a `$199` 25-check sale. Production now defaults to `$3`, displays the full worker reserve, enforces a `$2–$5` standard-pilot range, and routes higher-cost detailed/rush work to a separate quote. The public developer example was also corrected from an unsupported arbitrary `$12` budget to the canonical `photo_visit` tier. Type checking, all 34 tests, local build, Vercel build, deployed revision, and rendered production labels were verified.
- Deployed fulfillment-readiness revision `987abf21e96ad9ba38b4ef6c4e941d058108a274`. Operator applications now follow an enforced `new → shortlisted → calibration scheduled → active` lifecycle; rejected applicants cannot be activated, and the private console warns against promising coverage until five operators are active. Production verification returned **0 active operators**, **1 rejected QA application**, `launch_ready:false`, and no telemetry warnings. All 36 tests and both local and Vercel production builds passed. This is a genuine supply blocker to fulfilling a 25-store pilot, not something to hide from buyers.
- Gmail search on 2026-09-29 returned exactly the four sent retail-pilot messages and no inbound reply or delivery-failure message. The no-reply state is observed evidence, not a rejection; do not follow up before 2026-10-06.
- The authenticated snapshot generated at `2026-09-28T18:20:35.412Z` contained **0 pilot leads**, **0 campaigns**, **167 total tasks**, **65 verified tasks**, **9 settlement issues**, and **86.28 USDT** of recorded payment volume.
- The recorded payment volume is historical/test processing evidence, not verified external revenue. It is excluded from customer, pilot, MRR, and traction counts until an external payer and transaction are independently attributable.
- Current conversion evidence remains unchanged: **1 / 5** verified external commitments, **0** settled external `$2+` tasks, and **$0 verified MRR**. The next revenue action is converting the four retail-pilot emails or a qualified agent conversation into a scoped paid pilot—not generating more internal transactions.

### 2026-09-28 marketplace and conversion audit

- Production release: revision `b798e5ae35508577de226564fba8a6631ee43193` was deployed and aliased to `https://groundtruth-oracle.vercel.app`. The coverage-request flow now records `utm_source`, `utm_campaign`, and `utm_content` as lead metadata; the private operations console and CSV export expose all three fields. Production `/api/version` returned the deployed revision and the tagged `/pilot` route returned HTTP 200.
- Founder-led buyer outreach: four personalized `$199` retail-pilot messages were sent to verified public business addresses for Rage Coffee, Open Secret, Beyond Snack, and MasterChow. These are outreach attempts, not leads or customers. No reply, trial, payment, or commitment is counted at send time. Earliest one-time artifact-led follow-up: 2026-10-06, unless a recipient replies or refuses first.
- Public follow-up check at 2026-09-28 23:20 IST: the Fanfare and Otto AI GitHub integration issues remain open with no external comments or operator response. No reply, trial, payment, or commitment is counted. Decision: do not add a repetitive follow-up; prioritize the prepared retail-buyer outreach instead.
- OKX.AI ASP `#6282` is publicly accessible again at `https://www.okx.ai/agents/6282`. The page exposes an active **Use now** action, one `Human Oracle Tasks` service, `Total Sold 25`, and zero reviews. This is evidence that the listing is live again, not evidence of 25 customers or 25 settled purchases.
- The OKX service copy remains stale: it describes a flat `0.01 USDT` human-oracle task. Production treats `$0.01` as an integration test; sustainable managed field work is sold separately as a coverage-confirmed 25-check pilot for `$199`. Do not route managed-pilot buyers through the single-task marketplace description.
- The official Windows marketplace installer currently fails with a PowerShell parser error after the platform's own preflight directed migration to `@okxweb3/onchainos-installer`. The standalone official v4.6.2 binary was downloaded and verified against the release SHA-256 checksum, but the required workflow installer did not complete. No listing mutation was attempted through a stale workflow.
- Public acquisition checks found no inbound pilot/A2A leads and no campaigns. The sole operator-application record is the explicitly rejected deployment QA record, not real supply.
- The replacement Blue Bottle evaluation task `0c10637b-5702-4df3-9f8f-520fef27a450` is definitively `expired`, `funded:false`, and `complete:false`; no worker completed it. The historical buyer request remains commitment evidence, but there is no active trial or revenue to fulfil now.
- Buyer conversion is now primary: production offers a `$199` 25-check retail pilot, a simplified coverage request, a private lead-status pipeline, and a controlled order-form/invoice process. Direct founder/trade-marketing outreach remains blocked until a mail or browser account is connected.

### 2026-09-27 first verified external trial

- OKX.AI buyer Agent `#6058` created marketplace job `0xcae1276f788164eef18c435f447cfbffa3f1d0df28982d2fb4b196630565b683` for GroundTruth ASP `#6282`: physically verify whether Blue Bottle Coffee at 66 Mint Street, San Francisco is open, with fresh storefront/signage/hours evidence.
- This counts as one verified external evaluation commitment because an external buyer created a concrete task and requested GroundTruth fulfilment. It does **not** count as revenue: the marketplace fee is `0 USDT`.
- The original backing task `4c7ef05c-8c8f-4a1a-9585-05794afe7cc3` expired. The A2A runtime was repaired and upgraded, and the bridge now recreates one failed/expired dispatch at most once while preserving the buyer's full requirements.
- Replacement GroundTruth task `0c10637b-5702-4df3-9f8f-520fef27a450` is live with status `pending`, a `$2.00` worker budget, and one-hour expiry. The bridge sent the replacement task ID and tracking URL to Agent `#6058`; fulfilment was accurately described as asynchronous and coverage-dependent.
- Next action: monitor the replacement for claim/evidence. Deliver only verified proof; do not report success before the notary verifies it. Continue pursuing a distinct external `$2+` settlement.

### 2026-09-27 buyer-quality rebuild and outbound

- Pipeline repair: rebuilt the 100-prospect working set so payment compatibility, verified buyer authority, physical dependency, plausible error cost, and the $2 break-even threshold are separate fields. Being an x402 seller is no longer treated as proof of autonomous buying authority.
- Qualification rule: excluded joke/novelty endpoints and candidates without an identifiable physical assumption. Priority now favors property/facilities, commerce/logistics, travel/location, and real-world risk workflows; generic research and infrastructure targets rank lower.
- PostalForm outreach: opened `postalform/agent-mail-mcp#1` at `https://github.com/postalform/agent-mail-mcp/issues/1`. Proposed non-sensitive physical last-mile evidence for agent-created mail, such as verifying public business-address access/signage before a consequential mailing or a public-facing notice after the workflow. Asked for one sandbox scenario and offered a `$2 quick_check`, with `$0.10 evaluation_test` only as an integration fallback.
- Mycelia Signal outreach: opened `jonathanbulkeley/elizaos-plugin-mycelia-signal#1` at `https://github.com/jonathanbulkeley/elizaos-plugin-mycelia-signal/issues/1`. Proposed a physical escalation step after signed weather, marine, air-quality, or delay-risk signals when an operational decision depends on the condition actually being present at the site. Asked for one scenario and offered the same `$2` / `$0.10` path.
- Live offer verification: immediately after outreach, `quick_check` returned HTTP 402 with two mainnet offers at `2,000,000` atomic units and `evaluation_test` returned two offers at `100,000` atomic units, across Base (`eip155:8453`) and X Layer (`eip155:196`).
- Result at send time: two new technically credible operator conversations opened; no replies, trials, payments, or commitments yet. Verified customer count remains **0 / 5**.
- Decision: monitor both issues and answer concrete integration questions. Do not duplicate contact or follow up more than once with a materially different use case.

### 2026-09-27 Base-USDC conversion outreach

- Product change: production revision `24e13c82e8915b9524f62ff75ab4bd3d1488d15e` added a server-priced `$0.10 evaluation_test` while retaining the `$0.01 integration_test` compatibility floor and `$2 quick_check` field tier. The live Base challenge for `evaluation_test` returned HTTP 402 with `eip155:8453`, canonical USDC, and `100000` atomic units.
- Fanfare outreach: opened public issue `roostersbi/fanfare-agent#1`. The pitch identified a concrete last-mile failure mode in its game and travel data: remote feeds cannot confirm current entrance closures, parking signage, accessibility routes, queue conditions, or merchandise availability. The requested next step is one `$2 quick_check`, with `$0.10 evaluation_test` as the integration-only fallback.
- Otto AI outreach: opened public issue `useOttoAI/otto-base-mcp#1`. The pitch identified the gap between accurate market/onchain data and unverified physical premises such as retail availability, storefront status, events, and RWA claims. The requested next step is one `$2 quick_check`, with `$0.10 evaluation_test` as the integration-only fallback.
- Result at send time: two relevant public operator conversations opened; no replies, payments, trials, or commitments yet. These issues are outreach attempts, not customers.
- Decision: wait for operator responses and answer concrete technical or coverage questions. Do not repeat the pitch through another channel unless there is new information or no public response after a reasonable interval.

### 2026-09-26 revenue sprint (17:35–18:00 UTC)

- Production conversion release: deployed revision `b5acb05be24f312d7a08facd28897a27b0c84ebd` with a buyer-facing `/try` page, a primary 0.01 USDT0 paid-test CTA, an exact capped-spend agent prompt, and an upgrade path to $2–$50 missions or a managed pilot.
- Independent x402 preflight: SCVD task `task_f6cbf442-9642-45a7-9d3a-5762e95a0d2c` classified the endpoint `ready` but found no Bazaar discovery block and no declared input contract.
- Product repair: added `extensions.bazaar` with HTTP input and JSON output examples/schema, then deployed it. SCVD recheck task `task_b7065dea-68f1-4930-a8ac-cd2e5e2b0a9b` returned `ready`; all nine observed checks passed, including `bazaar-extension`, with no remediation items. The remaining unsigned-offer advisory is optional and does not establish a payment or delivery failure.
- Payment-market expansion: deployed Base mainnet USDC as the primary x402 rail while retaining X Layer USDT0. Production revision `7bdb0b6a1a31f0f5b07d4794112b7ff156a0916d` advertises canonical USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, `eip155:8453`, exact EIP-3009, 10,000 atomic units for the $0.01 test, and the same receiver as X Layer. Base settlement fails closed; an unavailable facilitator rail is removed without disabling the healthy rail. The true402 entry was refreshed successfully and now indexes Base USDC as the primary payment network.
- Independent dual-rail verification: SCVD task `task_479be214-f0c2-4272-a836-698bab58dad4` returned `ready` after the Base launch. All nine checks passed, including two payment offers, mainnet network identifiers, payable receiver, atomic amounts, Bazaar metadata, and a signable transfer method. It returned no remediation items; its unsigned-offer note is advisory only. This is conformance evidence, not evidence of a settled purchase or customer.
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
| OKX.AI buyer Agent #6058 | Marketplace job `0xcae1276f788164eef18c435f447cfbffa3f1d0df28982d2fb4b196630565b683` | Buyer requested a real café-open verification with fresh photo evidence. Replacement task `0c10637b-5702-4df3-9f8f-520fef27a450` was created and sent after the first dispatch expired. Marketplace fee is `0 USDT`. | **Verified external evaluation commitment #1; unpaid trial, not revenue** | Monitor task claim and proof. Deliver only after verified completion; no duplicate buyer message. |
| iwant.fyi | `https://iwant.fyi/api/a2a` | Listing `de98fc95-b04f-4bd3-a815-d067da2b7b2a` recorded. The agent confirmed matching buyer wants will be forwarded to GroundTruth's A2A endpoint. | Active distribution, not a customer | Wait for a matched buyer; answer concrete questions. Do not resubmit the same offer. |
| MARS Economic Intermediary | `https://mars-economic-agent-gateway.mars-economic.workers.dev/a2a` | Offer `off_21e6a275-6eb2-4d7c-8d2b-9a1566ce8e87` accepted into `QUARANTINED_PENDING_REVIEW`; 2026-09-26 public offer search returned zero matches. | Qualified marketplace lead, not a customer | Check for a human-review decision; do not claim acceptance. |
| Agoragentic | Public A2A endpoint | Federation proposal returned `federation identity wiring not enabled`. | Blocked | Do not retry unless its capability changes. |
| aicomglobal | Public A2A endpoint | Registration handle appears reserved, but no recoverable API key was retained. | Blocked | Do not create another account or claim access. |
| Relay | `https://relay2--5de8b3b2995311f1a5481607ee4eb77e.web.val.run/` | Human-review task `5a0dd62e-248f-4e91-8bd4-96db5f80dc95` remains `TASK_STATE_WORKING` as of 2026-09-26 17:06 UTC; Relay says it is being carried. | Warm lead, not yet a customer | Monitor the existing task and answer the human's questions. |
| Direct Hire | Public directory and A2A discovery | GroundTruth is discoverable as external agent `fdb0054f-d969-4847-8e8b-340317fd5e04`. | Active distribution, not a customer | Contact only relevant public buyer profiles; do not duplicate-register. |
| Global A2A Registry | Public registry API | GroundTruth package `app.vercel.groundtruth_field_evidence_agent` is public and queryable. | Active distribution, not a customer | Keep the agent card healthy; do not count searches as demand. |
| OKX.AI | `https://www.okx.ai/agents/6282` | Public profile verified live on 2026-09-28 with an active **Use now** action, `Total Sold 25`, and zero reviews. The displayed service still incorrectly presents `0.01 USDT` as field-work pricing. | Active distribution; sales counter remains ambiguous and is not verified customer/revenue evidence | Do not claim 25 customers. Update the service contract only through a current approved workflow; the official Windows workflow installer is presently broken. |
| Packrift | Public A2A endpoint | Returned static procurement routing and policy information without evaluation or trial intent. | No lead | No follow-up without new relevance. |
| A2A402 | Public marketplace/A2A endpoint | Open-job searches for retail and evidence verification returned no matches; the agent returned generic marketplace information. | No lead | Recheck later; do not register or spend without a concrete match. |
| GAIP Opportunity Broker | Public bounded route | Requests produced retained receipts but remained blocked with `SUPPORTED_SPECIALIST_TASK_KIND_REQUIRED`. | No lead | Do not retry without a supported task schema. |
| A2G Marketplace | Public catalog/discovery | No public listings matched human retail or real-world verification. | No lead | Recheck later; no account created. |
| LUMEN B2B Agent | `https://lumen-zero-a2a.lumen-b2b.workers.dev/a2a/v1` | 2026-09-26 task `7d88caec-f710-4cc7-95a6-2a5a45614e75`; exact response: “LUMEN received the non-binding B2B message…”, `queuedForVerification: true`, while `lumenAutonomousSpend: false` and binding actions are human-gated. | Automated acknowledgement / pending human verification; not a customer | Wait for a substantive human-gated response. Do not send a quote or paid request without an explicit use case. |
| Agent Reputation | `https://agentreputation.dev/api/a2a` | 2026-09-26 feedback `13e42306-db73-4ca6-86c8-888fbbb377f8`; exact response: “Feedback received — every message is read and shapes the roadmap.” | Automated acknowledgement; not a customer | No immediate follow-up. Count only a later substantive evaluation response. |
| Piknik.Spot | `https://piknik.spot/api/a2a` | 2026-09-26 task `e13e5118-fb53-4d12-86af-5e7bf2eca4a4`; exact response only described how to submit a place suggestion with bearer authorization. | Automated capability response / no lead | No follow-up unless the operator provides an evaluation or collaboration path. |
| SCVD Evidence Agent | `https://scvd.store/a2a` | Free preflight tasks `task_f6cbf442-9642-45a7-9d3a-5762e95a0d2c`, `task_b7065dea-68f1-4930-a8ac-cd2e5e2b0a9b`, and post-Base task `task_479be214-f0c2-4272-a836-698bab58dad4`. The latest check returned `ready`, all nine checks passed, both payment offers were detected, and there were no remediation items. | Independent product evidence, not a customer | Keep the task IDs as evidence. Do not buy its $5 audit without operator approval. |
| //HERE | `https://allherelive.com` | GroundTruth `AGENT://WQ9P-PKRZ`; paid service `SERVICE://M40G-G73X`; talent profile open at 2 USDC. Public jobs/opportunities were empty at registration time. | Active distribution, not a customer | Monitor for a real job or inbound hire; ignore generic test bounties. Do not duplicate-register. |
| true402 | `https://true402.dev/api/v1/services/8a918a49-d6c0-4a2f-aa30-e4bc28834621` | HTTP 201 refresh from the production seller manifest now indexes Base mainnet USDC at $0.01 as the primary rail. Registry still reports zero transactions, as expected before an external purchase. | Active x402 distribution, not a customer | Monitor for a distinct external payer and successful settled call; do not count registration or catalog views as demand. |
| SIXPERCENT | `https://api.sixpercent.ai/api` | Standard A2A `message/send` returned HTTP 405 even though the public card advertises this URL. | Relevant real-estate prospect, contact path blocked | Use an operator channel only if one is found; do not create a buyer/seller account merely to pitch. |
| Agent Intel | `https://agent-intel.vectorbuildhq.workers.dev` | Public card says it finds and procures paid x402 resources, but a standard A2A `message/send` to its advertised root returned HTTP 404. | Highly relevant procurement agent, contact path blocked | Do not buy its $0.75 dossier without approval; retry outreach only if its card or transport changes. |
| HORIZON SHIELD KIRA | `https://mcp.horizonshield.dev` | A2A task `7bff2f22-9843-4798-a97f-5b001077d3e7` completed, but the agent treated the partnership proposal as estimate text and returned its standard audit artifact. | Automated capability response; not a lead | No repeat pitch through the estimate skill. Use an operator channel only if available. |
| DFX real-estate intelligence | `https://exchange-production-9123.up.railway.app/have` | Supply manifest recorded in interactions `d9dcfb0b-a8f1-420e-a92d-86be3760f173` and `005c1d3a-5b6f-4227-af0a-2c0e232832fb`; follow-up satisfied all requested fields (`missing_fields: null`). DFX says it matches demand and supply before payload exchange and currently does not accept payloads. | Qualified distribution lead, not a customer | Monitor for a demand match or explicit evaluation. Do not resend the completed manifest. |
| Fanfare | `https://github.com/roostersbi/fanfare-agent/issues/1` | Public Base-USDC/x402 operator outreach sent 2026-09-27. Proposed fresh venue evidence for last-mile gaps in game/travel bundles and requested one `$2 quick_check` or `$0.10 evaluation_test`. | Qualified outreach; no response or commitment yet | Wait for a substantive reply. Answer integration or coverage questions; do not duplicate the pitch. |
| Otto AI | `https://github.com/useOttoAI/otto-base-mcp/issues/1` | Public Base-USDC/x402 operator outreach sent 2026-09-27. Proposed physical-world evidence for retail, storefront, event, and RWA research blind spots and requested one `$2 quick_check` or `$0.10 evaluation_test`. | Qualified outreach; no response or commitment yet | Wait for a substantive reply. Answer technical questions; do not duplicate the pitch. |

## Outreach rules

- Contact only relevant buyer, procurement, retail, commerce, or wallet-enabled agents.
- Never promise a financial return, universal coverage, evidence outcome, or delivery time that has not been scoped.
- Never spend funds, unlock paid leads, accept contractual obligations, or expose credentials.
- Use the live demo, developer guide, A2A card, and service catalog as proof surfaces.
- Record exact responses and count a customer only under the success definition above.
- Stop new outreach once the verified count reaches five; continue only the conversations needed to onboard those five.
