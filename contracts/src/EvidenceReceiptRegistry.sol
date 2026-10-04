// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EvidenceReceiptRegistry
 * @notice Minimal, privacy-preserving evidence receipts for GroundTruth tasks.
 * @dev Stores only hashes. Photos, coordinates, worker identity, and other
 *      sensitive evidence remain offchain and access-controlled.
 */
contract EvidenceReceiptRegistry {
    struct Receipt {
        bytes32 evidenceRoot;
        bytes32 proofSpecHash;
        bytes32 verdictHash;
        uint64 capturedAt;
        uint64 recordedAt;
    }

    address public immutable issuer;
    mapping(bytes32 taskKey => Receipt receipt) private receipts;

    event EvidenceReceiptRecorded(
        bytes32 indexed taskKey,
        bytes32 indexed evidenceRoot,
        bytes32 proofSpecHash,
        bytes32 verdictHash,
        uint64 capturedAt,
        uint64 recordedAt
    );

    error Unauthorized();
    error AlreadyRecorded(bytes32 taskKey);
    error InvalidReceipt();

    modifier onlyIssuer() {
        if (msg.sender != issuer) revert Unauthorized();
        _;
    }

    constructor(address _issuer) {
        if (_issuer == address(0)) revert InvalidReceipt();
        issuer = _issuer;
    }

    function recordReceipt(
        bytes32 taskKey,
        bytes32 evidenceRoot,
        bytes32 proofSpecHash,
        bytes32 verdictHash,
        uint64 capturedAt
    ) external onlyIssuer {
        if (
            taskKey == bytes32(0) ||
            evidenceRoot == bytes32(0) ||
            proofSpecHash == bytes32(0) ||
            verdictHash == bytes32(0) ||
            capturedAt == 0 ||
            capturedAt > block.timestamp
        ) revert InvalidReceipt();
        if (receipts[taskKey].recordedAt != 0) revert AlreadyRecorded(taskKey);

        uint64 recordedAt = uint64(block.timestamp);
        receipts[taskKey] = Receipt({
            evidenceRoot: evidenceRoot,
            proofSpecHash: proofSpecHash,
            verdictHash: verdictHash,
            capturedAt: capturedAt,
            recordedAt: recordedAt
        });

        emit EvidenceReceiptRecorded(
            taskKey,
            evidenceRoot,
            proofSpecHash,
            verdictHash,
            capturedAt,
            recordedAt
        );
    }

    function getReceipt(bytes32 taskKey) external view returns (Receipt memory) {
        return receipts[taskKey];
    }

    function exists(bytes32 taskKey) external view returns (bool) {
        return receipts[taskKey].recordedAt != 0;
    }
}
