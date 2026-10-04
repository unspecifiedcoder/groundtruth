// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/EvidenceReceiptRegistry.sol";
import "../src/GroundTruthUSDGTaskEscrow.sol";

contract DeployRobinhood is Script {
    address internal constant ROBINHOOD_TESTNET_USDG =
        0x7E955252E15c84f5768B83c41a71F9eba181802F;

    function run()
        external
        returns (EvidenceReceiptRegistry registry, GroundTruthUSDGTaskEscrow escrow)
    {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address issuer = vm.envOr("EVIDENCE_RECEIPT_ISSUER", vm.addr(deployerKey));

        vm.startBroadcast(deployerKey);
        registry = new EvidenceReceiptRegistry(issuer);
        escrow = new GroundTruthUSDGTaskEscrow(ROBINHOOD_TESTNET_USDG, issuer);
        vm.stopBroadcast();
    }
}
