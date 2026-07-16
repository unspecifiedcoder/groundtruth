# GroundTruth — Roadmap

## v0.1 (Hackathon — July 2026)
- [x] x402 pay-per-call ASP endpoint
- [x] A2MCP server (human_do, task_status, ground_truth_info)
- [x] Human worker PWA (claim, photo/form proof, submit)
- [x] Fail-closed verification (EXIF, perceptual hash, Groq vision)
- [x] GroundTruthPayroll.sol on X Layer
- [x] Supabase Realtime task feed
- [x] Admin review queue for needs_review tasks

## v0.2 (Post-hackathon)
- [ ] Multi-photo quorum: N humans must agree for high-stakes tasks
- [ ] Phone call proof type (human.call())
- [ ] Staked identity: workers bond USDT, slashed on failed proofs
- [ ] Agent SDK: `npm install groundtruth-sdk`
- [ ] Groq llama-4-scout vision verification for photo tasks
- [ ] Prediction market oracle integration (Polymarket, Manifold)

## v0.3
- [ ] Enterprise SLA: guaranteed response in < 5 minutes
- [ ] Geofenced tasks: only workers within X km can claim
- [ ] Task templates marketplace
- [ ] Revenue sharing with top workers
