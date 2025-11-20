// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IBasketVault
 * @notice Interface for Indexr basket vaults
 * @dev Extends ERC4626 standard with basket-specific functionality
 */
interface IBasketVault {
    /**
     * @notice Returns the underlying asset address (USDC in Phase 1)
     */
    function asset() external view returns (address);

    /**
     * @notice Returns the total amount of underlying assets managed by the vault
     */
    function totalAssets() external view returns (uint256);

    /**
     * @notice Converts assets to shares
     * @param assets Amount of assets to convert
     * @return shares Equivalent amount of shares
     */
    function convertToShares(uint256 assets) external view returns (uint256 shares);

    /**
     * @notice Converts shares to assets
     * @param shares Amount of shares to convert
     * @return assets Equivalent amount of assets
     */
    function convertToAssets(uint256 shares) external view returns (uint256 assets);

    /**
     * @notice Deposits assets and mints shares to receiver
     * @param assets Amount of assets to deposit
     * @param receiver Address to receive the minted shares
     * @return shares Amount of shares minted
     */
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    /**
     * @notice Withdraws assets by burning shares
     * @param assets Amount of assets to withdraw
     * @param receiver Address to receive the assets
     * @param owner Address that owns the shares
     * @return shares Amount of shares burned
     */
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);

    /**
     * @notice Redeems shares for assets
     * @param shares Amount of shares to redeem
     * @param receiver Address to receive the assets
     * @param owner Address that owns the shares
     * @return assets Amount of assets received
     */
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);

    /**
     * @notice Returns the basket ID for this vault
     * @return basketId The basket identifier (e.g., "INDXR-10")
     */
    function getBasketId() external view returns (string memory);

    /**
     * @notice Returns the registry address
     * @return registry The BasketRegistry contract address
     */
    function getRegistry() external view returns (address);

    /**
     * @notice Pauses deposits and withdrawals (owner only)
     */
    function pause() external;

    /**
     * @notice Unpauses deposits and withdrawals (owner only)
     */
    function unpause() external;

    /**
     * @notice Reports a rebalance (future-friendly function, may no-op in early Phase 1)
     * @param newTotalAssets New total assets after rebalance
     * @param timestamp Timestamp of the rebalance
     * @dev Called by off-chain rebalancer or owner
     */
    function reportRebalance(uint256 newTotalAssets, uint256 timestamp) external;
}

