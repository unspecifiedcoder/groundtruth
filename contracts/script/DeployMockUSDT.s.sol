// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../MockUSDT.sol";

contract DeployMockUSDT is Script {
    function run() external {
        uint256 pk = vm.envUint("SETTLEMENT_PRIVATE_KEY");
        vm.startBroadcast(pk);
        MockUSDT token = new MockUSDT();
        vm.stopBroadcast();
        console.log("MockUSDT deployed to:", address(token));
    }
}
