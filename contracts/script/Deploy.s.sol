// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/GroundTruthPayroll.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("SETTLEMENT_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        vm.startBroadcast(pk);
        GroundTruthPayroll payroll = new GroundTruthPayroll(deployer, deployer);
        vm.stopBroadcast();
        console.log("Deployed to:", address(payroll));
    }
}
