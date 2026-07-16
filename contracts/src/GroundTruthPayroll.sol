// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title GroundTruthPayroll
 * @notice On-chain per-task payout receipts on X Layer.
 *         Each task settlement emits a TaskSettled event with an idempotent taskKey.
 *         The contract is intentionally minimal — no upgrades, no admin, no pause.
 */
contract GroundTruthPayroll {
    event TaskSettled(
        bytes32 indexed taskKey,
        address indexed worker,
        address token,
        uint256 payoutAmount,
        uint256 feeAmount,
        address feeRecipient
    );

    // Replay guard: taskKey => settled
    mapping(bytes32 => bool) public settled;

    address public immutable feeRecipient;
    address public immutable operator;

    error AlreadySettled(bytes32 taskKey);
    error Unauthorized();
    error TransferFailed();

    modifier onlyOperator() {
        if (msg.sender != operator) revert Unauthorized();
        _;
    }

    constructor(address _feeRecipient, address _operator) {
        feeRecipient = _feeRecipient;
        operator = _operator;
    }

    /**
     * @notice Settle a task: transfer payout to worker and fee to feeRecipient.
     *         Caller must have pre-approved this contract for (payoutAmount + feeAmount).
     * @param taskKey      keccak256(taskId) — idempotency key
     * @param worker       Human oracle receiving payout
     * @param token        ERC-20 token address (USDT on X Layer)
     * @param payoutAmount Amount to worker (in token units)
     * @param feeAmount    Protocol fee (in token units)
     */
    function settle(
        bytes32 taskKey,
        address worker,
        address token,
        uint256 payoutAmount,
        uint256 feeAmount
    ) external onlyOperator {
        if (settled[taskKey]) revert AlreadySettled(taskKey);
        settled[taskKey] = true;

        _transfer(token, worker, payoutAmount);
        if (feeAmount > 0) {
            _transfer(token, feeRecipient, feeAmount);
        }

        emit TaskSettled(taskKey, worker, token, payoutAmount, feeAmount, feeRecipient);
    }

    function _transfer(address token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, to, amount)
        );
        if (!ok || (data.length > 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }
}
