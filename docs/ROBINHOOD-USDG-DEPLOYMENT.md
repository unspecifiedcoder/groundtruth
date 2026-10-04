# Robinhood Chain Testnet + USDG deployment

Verified: 2026-10-04

## Network and contracts

- Network: Robinhood Chain Testnet
- Chain ID: `46630`
- RPC: `https://rpc.testnet.chain.robinhood.com`
- Explorer: `https://explorer.testnet.chain.robinhood.com`
- Paxos test USDG: `0x7E955252E15c84f5768B83c41a71F9eba181802F`
- Evidence registry: `0x430172985b21458d73576435d4ad4beea85f376c`
- USDG task escrow: `0x725cce0916d2e8682438732fd9e79803b4fab2bd`

## Reproducible protocol demonstration

- Amount: `1.000000` test USDG
- Task key: `0x41469d468fbf89a1b4fcdb07becb5ec7fafde4942256d657faa13088856d7e7a`
- Registry deployment: `0x69cfd38327b39507ebe941d67fa21f22f41158ab543ebd3e13e52fcce55eed7c`
- Escrow deployment: `0xb17eededb8ed69b1ad82ee5bd218b5132c9cb23f7cee76ebb2c83318862544f4`
- USDG approval: `0x7226009453f138696fd7eeb1064906db8e21bb98abfb3b5aea527cb7ba3798c6`
- Task funding: `0x7484c4b08116443ff373cedd1fe538fd6dea6980da33dcea357c952dd5b50cbf`
- Evidence receipt: `0xe40962487564871146b878b3398e97f7388a70975e7e885ead9e4dc60e5ba9c1`
- USDG settlement: `0x0f055da7c51d942f14dfcb3b224b3f598d7a6ba8a7dd479f77bb49346f00e772`

The task finished in escrow status `Settled` and the registry reports that the receipt exists. The escrow and registry expose matching proof-specification, evidence-root, and verdict hashes. The payer and recipient are the same controlled demo wallet, so the test returns the USDG balance after proving the full state transition.

## Trust boundary

This is a testnet protocol demonstration. It proves contract deployment, USDG transfer and escrow logic, receipt publication, settlement, and independent readability. It is not revenue, customer traction, a completed physical visit, or proof that a photograph is truthful. Raw evidence and personal location data remain offchain.
