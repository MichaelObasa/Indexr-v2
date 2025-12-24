// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IBasketVault} from "./IBasketVault.sol";

/**
 * @title BasketVault
 * @notice ERC-4626 style vault for Indexr baskets
 * @dev Accepts USDC deposits and mints vault shares representing proportional ownership
 */
contract BasketVault is ERC4626, Ownable2Step, ReentrancyGuard, IBasketVault {
    using SafeERC20 for IERC20;

    /// @notice Basis points constant (10_000 = 100%)
    uint256 private constant BASIS_POINTS = 10_000;

    /// @notice Basket identifier (e.g., "INDXR-10")
    string public basketId;

    /// @notice Address of the BasketRegistry contract
    address public registry;

    /// @notice Pause state - when true, deposits and withdrawals are disabled
    bool public isPaused;

    /// @notice Emitted when the vault is paused
    event VaultPaused(string indexed basketId, address indexed by);

    /// @notice Emitted when the vault is unpaused
    event VaultUnpaused(string indexed basketId, address indexed by);

    /// @notice Emitted when a rebalance is reported (future use)
    event Rebalanced(string indexed basketId, uint256 newTotalAssets, uint256 timestamp);

    /**
     * @notice Constructor
     * @param asset_ The underlying asset address (USDC in Phase 1)
     * @param name_ Name for the vault token (e.g., "Indexr Top 10 Vault")
     * @param symbol_ Symbol for the vault token (e.g., "INDXR10")
     * @param basketId_ Basket identifier (e.g., "INDXR-10")
     * @param registry_ Address of the BasketRegistry contract
     * @param owner_ Initial owner address
     */
    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        string memory basketId_,
        address registry_,
        address owner_
    ) ERC20(name_, symbol_) ERC4626(asset_) Ownable(owner_) {
        require(registry_ != address(0), "BasketVault: registry cannot be zero");
        require(owner_ != address(0), "BasketVault: owner cannot be zero");

        basketId = basketId_;
        registry = registry_; 
    }

    /**
     * @notice Returns the underlying asset address
     * @return The asset address
     */
    function asset() public view override(ERC4626, IBasketVault) returns (address) {
        return ERC4626.asset();
    }

    /**
     * @notice Returns the total amount of underlying assets managed by the vault
     * @return The total assets
     */
    function totalAssets() public view override(ERC4626, IBasketVault) returns (uint256) {
        return ERC4626.totalAssets();
    }

    /**
     * @notice Converts assets to shares
     * @param assets Amount of assets to convert
     * @return shares Equivalent amount of shares
     */
    function convertToShares(uint256 assets) public view override(ERC4626, IBasketVault) returns (uint256 shares) {
        return ERC4626.convertToShares(assets);
    }

    /**
     * @notice Converts shares to assets
     * @param shares Amount of shares to convert
     * @return assets Equivalent amount of assets
     */
    function convertToAssets(uint256 shares) public view override(ERC4626, IBasketVault) returns (uint256 assets) {
        return ERC4626.convertToAssets(shares);
    }

    /**
     * @notice Deposits assets and mints shares to receiver
     * @param assets Amount of assets to deposit
     * @param receiver Address to receive the minted shares
     * @return shares Amount of shares minted
     */
    function deposit(uint256 assets, address receiver)
        public
        override(ERC4626, IBasketVault)
        whenNotPaused
        nonReentrant
        returns (uint256 shares)
    {
        return super.deposit(assets, receiver);
    }

    /**
     * @notice Mints shares to receiver by depositing assets
     * @param shares Amount of shares to mint
     * @param receiver Address to receive the minted shares
     * @return assets Amount of assets deposited
     */
    function mint(uint256 shares, address receiver)
        public
        override
        whenNotPaused
        nonReentrant
        returns (uint256 assets)
    {
        return super.mint(shares, receiver);
    }

    /**
     * @notice Withdraws assets by burning shares
     * @param assets Amount of assets to withdraw
     * @param receiver Address to receive the assets
     * @param owner Address that owns the shares
     * @return shares Amount of shares burned
     */
    function withdraw(uint256 assets, address receiver, address owner)
        public
        override(ERC4626, IBasketVault)
        whenNotPaused
        nonReentrant
        returns (uint256 shares)
    {
        return super.withdraw(assets, receiver, owner);
    }

    /**
     * @notice Redeems shares for assets
     * @param shares Amount of shares to redeem
     * @param receiver Address to receive the assets
     * @param owner Address that owns the shares
     * @return assets Amount of assets received
     */
    function redeem(uint256 shares, address receiver, address owner)
        public
        override(ERC4626, IBasketVault)
        whenNotPaused
        nonReentrant
        returns (uint256 assets)
    {
        return super.redeem(shares, receiver, owner);
    }

    /**
     * @notice Returns the basket ID for this vault
     * @return basketId The basket identifier
     */
    function getBasketId() external view override returns (string memory) {
        return basketId;
    }

    /**
     * @notice Returns the registry address
     * @return registry The BasketRegistry contract address
     */
    function getRegistry() external view override returns (address) {
        return registry;
    }

    /**
     * @notice Pauses deposits and withdrawals (owner only)
     */
    function pause() external override onlyOwner {
        require(!isPaused, "BasketVault: already paused");
        isPaused = true;
        emit VaultPaused(basketId, msg.sender);
    }

    /**
     * @notice Unpauses deposits and withdrawals (owner only)
     */
    function unpause() external override onlyOwner {
        require(isPaused, "BasketVault: not paused");
        isPaused = false;
        emit VaultUnpaused(basketId, msg.sender);
    }

    /**
     * @notice Reports a rebalance (future-friendly function, may no-op in early Phase 1)
     * @param newTotalAssets New total assets after rebalance
     * @param timestamp Timestamp of the rebalance
     * @dev Called by off-chain rebalancer or owner
     */
    function reportRebalance(uint256 newTotalAssets, uint256 timestamp) external override onlyOwner {
        // Phase 1: This is a placeholder for future rebalancing logic
        // In Phase 1, we may not perform actual rebalancing, but the interface is defined
        emit Rebalanced(basketId, newTotalAssets, timestamp);
    }

    /**
     * @notice Modifier to check if vault is not paused
     */
    modifier whenNotPaused() {
        require(!isPaused, "BasketVault: paused");
        _;
    }
}

