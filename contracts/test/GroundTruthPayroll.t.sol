// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/GroundTruthPayroll.sol";

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "allowance");
        require(balanceOf[from] >= amount, "balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract GroundTruthPayrollTest is Test {
    GroundTruthPayroll payroll;
    MockERC20 token;
    address operator = address(0xAA);
    address feeRecipient = address(0xBB);
    address worker = address(0xCC);

    function setUp() public {
        payroll = new GroundTruthPayroll(feeRecipient, operator);
        token = new MockERC20();
        token.mint(operator, 10_000_000);
        vm.prank(operator);
        token.approve(address(payroll), type(uint256).max);
    }

    function test_settle_emits_event() public {
        bytes32 key = keccak256("task-1");
        vm.prank(operator);
        vm.expectEmit(true, true, false, true);
        emit GroundTruthPayroll.TaskSettled(key, worker, address(token), 1_760_000, 240_000, feeRecipient);
        payroll.settle(key, worker, address(token), 1_760_000, 240_000);
    }

    function test_settle_replay_reverts() public {
        bytes32 key = keccak256("task-2");
        vm.startPrank(operator);
        payroll.settle(key, worker, address(token), 1_760_000, 240_000);
        vm.expectRevert(abi.encodeWithSelector(GroundTruthPayroll.AlreadySettled.selector, key));
        payroll.settle(key, worker, address(token), 1_760_000, 240_000);
        vm.stopPrank();
    }

    function test_non_operator_reverts() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert(GroundTruthPayroll.Unauthorized.selector);
        payroll.settle(keccak256("task-3"), worker, address(token), 1_000_000, 0);
    }

    function test_balances_after_settle() public {
        bytes32 key = keccak256("task-4");
        vm.prank(operator);
        payroll.settle(key, worker, address(token), 1_760_000, 240_000);
        assertEq(token.balanceOf(worker), 1_760_000);
        assertEq(token.balanceOf(feeRecipient), 240_000);
    }
}
