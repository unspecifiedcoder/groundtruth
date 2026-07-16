# GroundTruthPayroll — Security Notes

Author: GroundTruth team (founder is a smart contract auditor)

## Design Decisions

- **No upgrades**: immutable by design; upgrade = redeploy + update ENV
- **Operator-only settle**: only the backend hot wallet can call settle()
- **Idempotent taskKey**: keccak256(taskId) — prevents double-payout on retry
- **transferFrom pattern**: operator pre-approves contract; contract never holds funds
- **No pause**: simplicity over admin surface; if compromised, revoke operator approval

## Known Limitations

- Operator key compromise = potential fund drain (mitigated: operator holds only approved allowance, not custody)
- No multi-sig on feeRecipient (acceptable for hackathon; ROADMAP: Gnosis Safe)
