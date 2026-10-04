// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/EvidenceReceiptRegistry.sol";

contract EvidenceReceiptRegistryTest is Test {
    EvidenceReceiptRegistry registry;
    address issuer = address(0xA11CE);
    bytes32 taskKey = keccak256("groundtruth-task-1");
    bytes32 evidenceRoot = keccak256("evidence-manifest");
    bytes32 proofSpecHash = keccak256("proof-specification");
    bytes32 verdictHash = keccak256("verified:checklist-pass");

    function setUp() public {
        registry = new EvidenceReceiptRegistry(issuer);
        vm.warp(1_800_000_000);
    }

    function test_recordsHashOnlyReceipt() public {
        vm.prank(issuer);
        registry.recordReceipt(taskKey, evidenceRoot, proofSpecHash, verdictHash, 1_799_999_900);

        EvidenceReceiptRegistry.Receipt memory receipt = registry.getReceipt(taskKey);
        assertEq(receipt.evidenceRoot, evidenceRoot);
        assertEq(receipt.proofSpecHash, proofSpecHash);
        assertEq(receipt.verdictHash, verdictHash);
        assertEq(receipt.capturedAt, 1_799_999_900);
        assertEq(receipt.recordedAt, 1_800_000_000);
        assertTrue(registry.exists(taskKey));
    }

    function test_rejectsUnauthorizedIssuer() public {
        vm.expectRevert(EvidenceReceiptRegistry.Unauthorized.selector);
        registry.recordReceipt(taskKey, evidenceRoot, proofSpecHash, verdictHash, 1_799_999_900);
    }

    function test_rejectsReplay() public {
        vm.startPrank(issuer);
        registry.recordReceipt(taskKey, evidenceRoot, proofSpecHash, verdictHash, 1_799_999_900);
        vm.expectRevert(abi.encodeWithSelector(EvidenceReceiptRegistry.AlreadyRecorded.selector, taskKey));
        registry.recordReceipt(taskKey, evidenceRoot, proofSpecHash, verdictHash, 1_799_999_900);
        vm.stopPrank();
    }

    function test_rejectsFutureCaptureTime() public {
        vm.prank(issuer);
        vm.expectRevert(EvidenceReceiptRegistry.InvalidReceipt.selector);
        registry.recordReceipt(taskKey, evidenceRoot, proofSpecHash, verdictHash, 1_800_000_001);
    }

    function test_rejectsEmptyHash() public {
        vm.prank(issuer);
        vm.expectRevert(EvidenceReceiptRegistry.InvalidReceipt.selector);
        registry.recordReceipt(taskKey, bytes32(0), proofSpecHash, verdictHash, 1_799_999_900);
    }
}
