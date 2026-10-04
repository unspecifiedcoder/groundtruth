// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title GroundTruthUSDGTaskEscrow
 * @notice Minimal USDG escrow for physical-verification tasks.
 * @dev Evidence remains private. Only deterministic task and verdict hashes are
 *      written onchain. The issuer may settle verified work or refund the payer.
 */
contract GroundTruthUSDGTaskEscrow {
    enum Status {
        None,
        Funded,
        Settled,
        Refunded
    }

    struct TaskEscrow {
        address payer;
        address recipient;
        uint128 amount;
        Status status;
        bytes32 proofSpecHash;
        bytes32 evidenceRoot;
        bytes32 verdictHash;
        uint64 fundedAt;
        uint64 resolvedAt;
    }

    IERC20Minimal public immutable usdg;
    address public immutable issuer;
    mapping(bytes32 taskKey => TaskEscrow task) private tasks;

    event TaskFunded(
        bytes32 indexed taskKey,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        bytes32 proofSpecHash
    );
    event TaskSettled(
        bytes32 indexed taskKey,
        address indexed recipient,
        uint256 amount,
        bytes32 evidenceRoot,
        bytes32 verdictHash
    );
    event TaskRefunded(bytes32 indexed taskKey, address indexed payer, uint256 amount);

    error Unauthorized();
    error InvalidTask();
    error InvalidState();
    error TokenTransferFailed();

    modifier onlyIssuer() {
        if (msg.sender != issuer) revert Unauthorized();
        _;
    }

    constructor(address _usdg, address _issuer) {
        if (_usdg == address(0) || _issuer == address(0)) revert InvalidTask();
        usdg = IERC20Minimal(_usdg);
        issuer = _issuer;
    }

    function fundTask(
        bytes32 taskKey,
        address recipient,
        uint128 amount,
        bytes32 proofSpecHash
    ) external {
        if (
            taskKey == bytes32(0) ||
            recipient == address(0) ||
            amount == 0 ||
            proofSpecHash == bytes32(0)
        ) revert InvalidTask();
        if (tasks[taskKey].status != Status.None) revert InvalidState();

        tasks[taskKey] = TaskEscrow({
            payer: msg.sender,
            recipient: recipient,
            amount: amount,
            status: Status.Funded,
            proofSpecHash: proofSpecHash,
            evidenceRoot: bytes32(0),
            verdictHash: bytes32(0),
            fundedAt: uint64(block.timestamp),
            resolvedAt: 0
        });

        if (!usdg.transferFrom(msg.sender, address(this), amount)) revert TokenTransferFailed();
        emit TaskFunded(taskKey, msg.sender, recipient, amount, proofSpecHash);
    }

    function settleTask(
        bytes32 taskKey,
        bytes32 evidenceRoot,
        bytes32 verdictHash
    ) external onlyIssuer {
        TaskEscrow storage task = tasks[taskKey];
        if (task.status != Status.Funded) revert InvalidState();
        if (evidenceRoot == bytes32(0) || verdictHash == bytes32(0)) revert InvalidTask();

        task.status = Status.Settled;
        task.evidenceRoot = evidenceRoot;
        task.verdictHash = verdictHash;
        task.resolvedAt = uint64(block.timestamp);

        if (!usdg.transfer(task.recipient, task.amount)) revert TokenTransferFailed();
        emit TaskSettled(taskKey, task.recipient, task.amount, evidenceRoot, verdictHash);
    }

    function refundTask(bytes32 taskKey) external onlyIssuer {
        TaskEscrow storage task = tasks[taskKey];
        if (task.status != Status.Funded) revert InvalidState();

        task.status = Status.Refunded;
        task.resolvedAt = uint64(block.timestamp);

        if (!usdg.transfer(task.payer, task.amount)) revert TokenTransferFailed();
        emit TaskRefunded(taskKey, task.payer, task.amount);
    }

    function getTask(bytes32 taskKey) external view returns (TaskEscrow memory) {
        return tasks[taskKey];
    }
}
