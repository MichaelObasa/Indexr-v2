// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IBasketRegistry
 * @notice Interface for the Indexr basket registry
 * @dev Central registry tracking all Indexr baskets and their metadata
 */
interface IBasketRegistry {
    /**
     * @notice Basket information structure
     * @param basketId Unique identifier for the basket (e.g., "INDXR-10")
     * @param vault Address of the BasketVault contract
     * @param tokens Array of token addresses in the basket
     * @param targetWeightsBps Target weights in basis points (10_000 = 100%)
     * @param active Whether the basket is currently active
     * @param category Basket category (0 = Classic, 1 = Thematic, 2 = Specialty)
     */
    struct BasketInfo {
        string basketId;
        address vault;
        address[] tokens;
        uint256[] targetWeightsBps;
        bool active;
        uint8 category;
    }

    /**
     * @notice Gets basket information by ID
     * @param basketId The basket identifier
     * @return info The basket information struct
     */
    function getBasketById(string calldata basketId) external view returns (BasketInfo memory);

    /**
     * @notice Gets the total number of registered baskets
     * @return count Number of baskets
     */
    function getBasketCount() external view returns (uint256);

    /**
     * @notice Gets basket information by index
     * @param index The index of the basket
     * @return info The basket information struct
     */
    function getBasketAtIndex(uint256 index) external view returns (BasketInfo memory);

    /**
     * @notice Checks if a basket is active
     * @param basketId The basket identifier
     * @return active True if the basket is active
     */
    function isBasketActive(string calldata basketId) external view returns (bool);

    /**
     * @notice Gets the vault address for a basket
     * @param basketId The basket identifier
     * @return vault The vault contract address
     */
    function getVault(string calldata basketId) external view returns (address);

    /**
     * @notice Registers a new basket (owner only)
     * @param basketId Unique identifier for the basket
     * @param vault Address of the BasketVault contract
     * @param tokens Array of token addresses
     * @param targetWeightsBps Target weights in basis points
     * @param category Basket category
     */
    function registerBasket(
        string calldata basketId,
        address vault,
        address[] calldata tokens,
        uint256[] calldata targetWeightsBps,
        uint8 category
    ) external;

    /**
     * @notice Updates basket target tokens and weights (owner only)
     * @param basketId The basket identifier
     * @param tokens New array of token addresses
     * @param targetWeightsBps New target weights in basis points
     */
    function updateBasketTargets(
        string calldata basketId,
        address[] calldata tokens,
        uint256[] calldata targetWeightsBps
    ) external;

    /**
     * @notice Sets the active status of a basket (owner only)
     * @param basketId The basket identifier
     * @param active New active status
     */
    function setBasketActive(string calldata basketId, bool active) external;
}

