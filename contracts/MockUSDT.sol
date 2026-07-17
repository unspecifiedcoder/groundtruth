// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockUSDT — testnet USDT for GroundTruth demos
contract MockUSDT {
    string public name = "Mock USDT";
    string public symbol = "mUSDT";
    uint8 public decimals = 6;
    uint256 public totalSupply;

    address public owner;

    uint256 public constant FAUCET_AMOUNT = 10 * 1e6; // 10 mUSDT
    uint256 public constant FAUCET_COOLDOWN = 1 hours; // 1h for demo

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public lastFaucetTime;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        owner = msg.sender;
        _mint(msg.sender, 1_000_000 * 1e6); // 1M mUSDT seed
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "allowance exceeded");
        allowance[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }

    /// @notice Drip 10 mUSDT to any address, once per hour
    function drip(address to) external {
        require(
            block.timestamp >= lastFaucetTime[to] + FAUCET_COOLDOWN,
            "Cooldown: wait 1h between drips"
        );
        lastFaucetTime[to] = block.timestamp;
        _mint(to, FAUCET_AMOUNT);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
