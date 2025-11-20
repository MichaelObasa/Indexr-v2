// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IBasketRegistry} from "./IBasketRegistry.sol";

/**
 * @title BasketRegistry
 * @notice Central registry tracking all Indexr baskets and their metadata
 * @dev Source of truth for frontend, backend, and EchoPay services
 */
contract BasketRegistry is Ownable2Step, IBasketRegistry {
    /// @notice Basis points constant (10_000 = 100%)
    uint256 private constant BASIS_POINTS = 10_000;

    /// @notice Mapping from basket ID to basket information
    mapping(string => BasketInfo) private baskets;

    /// @notice Array of all registered basket IDs
    string[] private basketIds;

    /// @notice Mapping from basket ID to index in basketIds array
    mapping(string => uint256) private basketIdToIndex;

    /// @notice Emitted when a new basket is registered
    event BasketRegistered(string indexed basketId, address indexed vault);

    /// @notice Emitted when basket targets are updated
    event BasketTargetsUpdated(string indexed basketId, address[] tokens, uint256[] targetWeightsBps);

    /// @notice Emitted when basket active status is updated
    event BasketStatusUpdated(string indexed basketId, bool active);

    /**
     * @notice Constructor
     * @param owner_ Initial owner address
     */
    constructor(address owner_) Ownable2Step() {
        require(owner_ != address(0), "BasketRegistry: owner cannot be zero");
        _transferOwnership(owner_);
    }

    /**
     * @notice Gets basket information by ID
     * @param basketId The basket identifier
     * @return info The basket information struct
     */
    function getBasketById(string calldata basketId) external view override returns (BasketInfo memory) {
        BasketInfo memory info = baskets[basketId];
        require(info.vault != address(0), "BasketRegistry: basket not found");
        return info;
    }

    /**
     * @notice Gets the total number of registered baskets
     * @return count Number of baskets
     */
    function getBasketCount() external view override returns (uint256) {
        return basketIds.length;
    }

    /**
     * @notice Gets basket information by index
     * @param index The index of the basket
     * @return info The basket information struct
     */
    function getBasketAtIndex(uint256 index) external view override returns (BasketInfo memory) {
        require(index < basketIds.length, "BasketRegistry: index out of bounds");
        return baskets[basketIds[index]];
    }

    /**
     * @notice Checks if a basket is active
     * @param basketId The basket identifier
     * @return active True if the basket is active
     */
    function isBasketActive(string calldata basketId) external view override returns (bool) {
        BasketInfo memory info = baskets[basketId];
        require(info.vault != address(0), "BasketRegistry: basket not found");
        return info.active;
    }

    /**
     * @notice Gets the vault address for a basket
     * @param basketId The basket identifier
     * @return vault The vault contract address
     */
    function getVault(string calldata basketId) external view override returns (address) {
        BasketInfo memory info = baskets[basketId];
        require(info.vault != address(0), "BasketRegistry: basket not found");
        return info.vault;
    }

    /**
     * @notice Registers a new basket (owner only)
     * @param basketId_ Unique identifier for the basket
     * @param vault Address of the BasketVault contract
     * @param tokens Array of token addresses
     * @param targetWeightsBps Target weights in basis points
     * @param category Basket category (0 = Classic, 1 = Thematic, 2 = Specialty)
     */
    function registerBasket(
        string calldata basketId_,
        address vault,
        address[] calldata tokens,
        uint256[] calldata targetWeightsBps,
        uint8 category
    ) external override onlyOwner {
        require(vault != address(0), "BasketRegistry: vault cannot be zero");
        require(baskets[basketId_].vault == address(0), "BasketRegistry: basket already exists");
        require(tokens.length > 0, "BasketRegistry: must have at least one token");
        require(tokens.length == targetWeightsBps.length, "BasketRegistry: tokens and weights length mismatch");

        uint256 totalWeight = 0;
        for (uint256 i = 0; i < targetWeightsBps.length; i++) {
            totalWeight += targetWeightsBps[i];
        }
        require(totalWeight == BASIS_POINTS, "BasketRegistry: weights must sum to 100%");

        baskets[basketId_] = BasketInfo({
            basketId: basketId_,
            vault: vault,
            tokens: tokens,
            targetWeightsBps: targetWeightsBps,
            active: true,
            category: category
        });

        basketIdToIndex[basketId_] = basketIds.length;
        basketIds.push(basketId_);

        emit BasketRegistered(basketId_, vault);
    }

    /**
     * @notice Updates basket target tokens and weights (owner only)
     * @param basketId_ The basket identifier
     * @param tokens New array of token addresses
     * @param targetWeightsBps New target weights in basis points
     */
    function updateBasketTargets(
        string calldata basketId_,
        address[] calldata tokens,
        uint256[] calldata targetWeightsBps
    ) external override onlyOwner {
        BasketInfo storage info = baskets[basketId_];
        require(info.vault != address(0), "BasketRegistry: basket not found");
        require(tokens.length > 0, "BasketRegistry: must have at least one token");
        require(tokens.length == targetWeightsBps.length, "BasketRegistry: tokens and weights length mismatch");

        uint256 totalWeight = 0;
        for (uint256 i = 0; i < targetWeightsBps.length; i++) {
            totalWeight += targetWeightsBps[i];
        }
        require(totalWeight == BASIS_POINTS, "BasketRegistry: weights must sum to 100%");

        info.tokens = tokens;
        info.targetWeightsBps = targetWeightsBps;

        emit BasketTargetsUpdated(basketId_, tokens, targetWeightsBps);
    }

    /**
     * @notice Sets the active status of a basket (owner only)
     * @param basketId_ The basket identifier
     * @param active New active status
     */
    function setBasketActive(string calldata basketId_, bool active) external override onlyOwner {
        BasketInfo storage info = baskets[basketId_];
        require(info.vault != address(0), "BasketRegistry: basket not found");
        require(info.active != active, "BasketRegistry: status unchanged");

        info.active = active;
        emit BasketStatusUpdated(basketId_, active);
    }
}

