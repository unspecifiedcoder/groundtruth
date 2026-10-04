// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/EvidenceReceiptRegistry.sol";

contract DeployEvidenceReceiptRegistry is Script {
    function run() external returns (EvidenceReceiptRegistry registry) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address issuer = vm.envOr("EVIDENCE_RECEIPT_ISSUER", vm.addr(deployerKey));
        vm.startBroadcast(deployerKey);
        registry = new EvidenceReceiptRegistry(issuer);
        vm.stopBroadcast();
    }
}
