// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/GroundTruthPayroll.sol";

contract Deploy is Script {
    function run() external {
        address feeRecipient = vm.envAddress("FEE_RECIPIENT");
        address operator = vm.envAddress("OPERATOR_ADDRESS");
        vm.broadcast();
        GroundTruthPayroll payroll = new GroundTruthPayroll(feeRecipient, operator);
        console.log("GroundTruthPayroll deployed at:", address(payroll));
    }
}
