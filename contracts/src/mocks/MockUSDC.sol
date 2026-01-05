// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing on testnets
 * @dev Mintable ERC20 with 6 decimals (like real USDC)
 */
contract MockUSDC is ERC20 {
    uint8 private constant DECIMALS = 6;

    constructor() ERC20("Mock USDC", "USDC") {}

    /**
     * @notice Returns the number of decimals (6, like real USDC)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Mints tokens to a specified address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function - mints 10,000 USDC to the caller
     * @dev For testnet use - allows anyone to get test tokens
     */
    function faucet() external {
        _mint(msg.sender, 10_000 * 10 ** DECIMALS);
    }
}

