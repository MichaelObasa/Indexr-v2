// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IOracleAdapter
 * @notice Unified interface for reading token prices in USD
 * @dev For Phase 1, this is an interface only. Implementation may be on-chain or off-chain.
 */
interface IOracleAdapter {
    /**
     * @notice Returns price of `token` in USD with `decimals` precision
     * @param token The token address to get the price for
     * @return price The price in USD
     * @return decimals The number of decimals for the price
     * @dev If price is not available, should revert or return 0 (implementation-defined)
     */
    function getPriceUsd(address token) external view returns (uint256 price, uint8 decimals);
}

