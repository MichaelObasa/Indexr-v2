# Contracts Spec - Indexr v2 (Phase 1)

## 0. Scope & Goals

**Goal:**  

Implement the **on-chain core** for Indexr v2 on **Arbitrum** using:

- Non-custodial **basket vaults** (one per Indexr basket)

- **USDC** as the deposit/withdraw asset in Phase 1

- Clean, modular contracts that auditors and other engineers can reason about

- Simple, rules-based rebalancing (AI/ML can plug in later, but not required now)

**Out of scope for Phase 1 contracts:**

- AI Signals Engine / ML logic

- Fiat rails / VRP / Open Banking

- Cross-chain logic

- Governance/tokenomics

- Access control complexity beyond simple owner / roles

- EchoPay internals (it's an off-chain module that just calls the contracts)

## 1. Technical Environment

- **Chain:** Arbitrum (testnet → mainnet later)

- **Base asset:** USDC (ERC-20)

- **Language:** Solidity ^0.8.x

- **Standards / Libraries:**

  - OpenZeppelin:

    - `ERC20`

    - `ERC4626` (vault)

    - `Ownable` / `Ownable2Step`

    - `ReentrancyGuard`

    - `SafeERC20`

    - `AccessControl` (if needed)

- **Tooling:** Foundry for compilation, testing, scripting

## 2. Overall Design

Indexr Phase 1 consists of:

1. **Basket Vaults**  

   Smart contracts that:

   - accept USDC deposits

   - mint "vault shares" (ERC-20)

   - track total assets and share conversions

   - (later) hold a portfolio of tokens representing the basket

2. **Basket Registry**  

   A central contract that:

   - knows all basket vaults by ID (e.g. `INDXR-10`, `INDXR-AI`)

   - stores metadata, token lists and target weights

   - is used by the backend, EchoPay and any off-chain services

3. **Oracle Adapter**  

   An interface (with simple implementation later) for reading token prices from:

   - Chainlink where available

   - Pyth where needed  

   The core contracts should **not** depend on a specific oracle vendor; they depend on `IOracleAdapter`.

4. **Rebalancing Hooks (off-chain driven)**  

   Rebalancing logic in Phase 1 is primarily off-chain:

   - a rebalancer bot calculates desired trades

   - the bot submits a transaction to the vault with specific actions

   - vault executes swaps (in a later iteration) or updates accounting  

   For Phase 1, we may keep rebalancing very minimal, but the contracts must expose the right functions and events to support it.

5. **Strategy Engine (Future / Off-chain)**  

   The "brain" (rules engine → AI later) sits off-chain and:

   - reads basket state + prices

   - decides new target weights

   - instructs the vault via allowed functions  

   **Important:** Contracts must **not** depend on AI. They just provide clean hooks.

**EchoPay**  

- EchoPay is NOT a contract in Phase 1.

- It's an off-chain module that:

  - holds user auto-invest plans

  - calls vault `deposit()` on a schedule

- It should interact with the contracts via a small client (e.g. `IndexrOnchainClient` on the backend).

- No EchoPay-specific Solidity is needed at this stage.

## 3. Contracts Overview

We will implement the following contracts/interfaces:

1. **`BasketVault`** (core vault, one instance per basket)

2. **`BasketRegistry`** (global registry)

3. **`IOracleAdapter`** (interface only)

4. **`IBasketVault` / `IBasketRegistry`** (interfaces)

5. Optionally: a simple **`VaultFactory`** if we want programmatic creation later (not required initially).

We will structure the `/contracts/src` folder roughly as:

- `src/vaults/BasketVault.sol`

- `src/registry/BasketRegistry.sol`

- `src/oracles/IOracleAdapter.sol`

- `src/vaults/IBasketVault.sol`

- `src/registry/IBasketRegistry.sol`

- (Optional later) `src/factory/VaultFactory.sol`

## 4. BasketVault Specification

### 4.1 Purpose

`BasketVault` is an **ERC-4626-style vault** that:

- Accepts **USDC** as the underlying asset in Phase 1

- Issues ERC-20 "vault shares" representing pro-rata ownership

- Holds a set of **underlying tokens** defined by the registry (future)

- Provides clean interfaces for:

  - deposits

  - withdrawals

  - reading total assets / NAV

  - rebalancing (admin / rebalancer only)

In Phase 1, we can start with a simplified model:

- Vault asset = USDC

- Underlying portfolio may initially just be USDC (no swaps)

- The interfaces must allow us to add real off-chain driven rebalancing later without breaking compatibility

### 4.2 Inheritance & Interfaces

- Inherit from:

  - `ERC4626`

  - `Ownable2Step`

  - `ReentrancyGuard`

- Implement interface:

  - `IBasketVault`

### 4.3 Key State Variables

- `address public immutable asset;`  

  (from ERC4626 – USDC token address)

- `string public basketId;`  

  e.g. `"INDXR-10"`

- `address public registry;`  

  Address of `BasketRegistry` (for metadata/token list)

- `bool public isPaused;`  

  Simple pause switch for deposits/withdrawals (emergency use)

**Note:**  

Phase 1 may not hold real token portfolios yet (just USDC). When we do, we will rely on the registry for allowed tokens and target weights and a rebalancer function will adjust holdings.

### 4.4 Core Functions

Implement (or inherit) the usual ERC4626 functions:

- `deposit(uint256 assets, address receiver)`

- `mint(uint256 shares, address receiver)`

- `withdraw(uint256 assets, address receiver, address owner)`

- `redeem(uint256 shares, address receiver, address owner)`

- `totalAssets()`

- `convertToShares(uint256 assets)`

- `convertToAssets(uint256 shares)`

Add vault-specific functions:

```solidity
function pause() external onlyOwner;
function unpause() external onlyOwner;
function getBasketId() external view returns (string memory);
function getRegistry() external view returns (address);
```

For future rebalancing support (may be no-op in early Phase 1 but defined in the interface):

```solidity
// to be called by off-chain rebalancer / owner
function reportRebalance(
    uint256 newTotalAssets,
    uint256 timestamp
) external onlyOwner;
```

**Note:**

The exact rebalancing trade logic (DEX swaps, etc.) can be added in a later iteration. For Phase 1, it's enough to have the ERC4626 behavior and pause mechanics, plus events.

### 4.5 Events

```solidity
event VaultPaused(string basketId, address indexed by);
event VaultUnpaused(string basketId, address indexed by);
```

ERC4626 already emits standard Deposit / Withdraw events.

### 4.6 Security Considerations

- Guard deposit/withdraw functions with `whenNotPaused` or a custom `require(!isPaused)`.

- Use `ReentrancyGuard` on external functions that move funds.

- Only owner (or future AccessControl role) should be able to:
  - pause/unpause
  - update sensitive addresses (if any).

- No external arbitrary calls – keep interactions minimal and well-defined.

**Upgradability (Phase 1):**

- Start with non-upgradeable contracts for simplicity.

- If we need upgrades later, we can deploy new vaults and provide a migration path (UI-driven), rather than proxies.

## 5. BasketRegistry Specification

### 5.1 Purpose

`BasketRegistry` is a central contract that:

- Tracks all available Indexr baskets

- Stores:
  - `basketId` (string or bytes32)
  - vault address
  - list of token addresses
  - target weights (basis points)
  - category (Classic, Thematic, Specialty)
  - risk flags (if needed)
  - active/disabled status

It is the source of truth for:

- Frontend (what baskets exist, composition, status)

- Backend/EchoPay (which vault address to target)

- Future AI engine (what tokens/weights each basket has)

### 5.2 Interface & Key Types

Define a struct (exact layout can be tuned):

```solidity
struct BasketInfo {
    string basketId;
    address vault;
    address[] tokens;
    uint256[] targetWeightsBps; // e.g. 10_000 = 100%
    bool active;
    uint8 category; // 0 = Classic, 1 = Thematic, 2 = Specialty
}
```

Interface `IBasketRegistry` should include:

```solidity
function getBasketById(string calldata basketId) external view returns (BasketInfo memory);
function getBasketCount() external view returns (uint256);
function getBasketAtIndex(uint256 index) external view returns (BasketInfo memory);
function isBasketActive(string calldata basketId) external view returns (bool);
function getVault(string calldata basketId) external view returns (address);
```

Admin functions (onlyOwner):

```solidity
function registerBasket(
    string calldata basketId,
    address vault,
    address[] calldata tokens,
    uint256[] calldata targetWeightsBps,
    uint8 category
) external;

function updateBasketTargets(
    string calldata basketId,
    address[] calldata tokens,
    uint256[] calldata targetWeightsBps
) external;

function setBasketActive(
    string calldata basketId,
    bool active
) external;
```

**Validation rules** (enforced in registry):

- `tokens.length == targetWeightsBps.length`
- `tokens.length >= 1` (you can have a USDC-only basket in Phase 1)
- Sum of `targetWeightsBps` = `10_000` (100%)
- `basketId` must be unique
- `vault` must be non-zero

### 5.3 Events

```solidity
event BasketRegistered(string basketId, address vault);
event BasketTargetsUpdated(string basketId, address[] tokens, uint256[] targetWeightsBps);
event BasketStatusUpdated(string basketId, bool active);
```

## 6. OracleAdapter Specification

### 6.1 Purpose

`IOracleAdapter` provides a unified way for off-chain services (and, if needed, contracts) to read prices for tokens.

For Phase 1, we only need an interface. The actual implementation may live on-chain or entirely off-chain (e.g. using `callStatic` + off-chain logic).

### 6.2 Interface

```solidity
interface IOracleAdapter {
    /**
     * @notice Returns price of `token` in USD with `decimals` precision.
     * @dev If price is not available, should revert or return 0 (implementation-defined).
     */
    function getPriceUsd(address token) external view returns (uint256 price, uint8 decimals);
}
```

We may extend this later, but Phase 1 contracts only need to know this shape if they use it at all. It is acceptable for Phase 1 that only the backend calls Chainlink/Pyth directly and the contracts do not query the oracle.

## 7. Interfaces

### 7.1 IBasketVault

This interface should expose:

```solidity
interface IBasketVault {
    function asset() external view returns (address);
    function totalAssets() external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function getBasketId() external view returns (string memory);
    function getRegistry() external view returns (address);
    function pause() external;
    function unpause() external;
    // Future-friendly function; may no-op in early Phase 1
    function reportRebalance(uint256 newTotalAssets, uint256 timestamp) external;
}
```

### 7.2 IBasketRegistry

As above, with only read functions for external consumers and admin functions for owner.

## 8. Access Control & Roles

For Phase 1, keep access control very simple:

**BasketVault:**

- owner can:
  - pause/unpause
  - call `reportRebalance` (or assign rebalancer later)

**BasketRegistry:**

- owner can:
  - register baskets
  - update targets
  - toggle active status

**Future:**

We can migrate to `AccessControl` with:
- `DEFAULT_ADMIN_ROLE`
- `REGISTRY_ADMIN_ROLE`
- `REBALANCER_ROLE`

For now, keep it as `Ownable2Step` to support safe ownership transfers later (e.g. to a multisig).

## 9. Events & Indexing

All events must be well-structured and indexable:

**From BasketVault:**

- `event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);` (from ERC4626)
- `event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares);` (from ERC4626)
- `event VaultPaused(string basketId, address indexed by);`
- `event VaultUnpaused(string basketId, address indexed by);`
- (Optional later) `event Rebalanced(string basketId, uint256 newTotalAssets, uint256 timestamp);`

**From BasketRegistry:**

- `event BasketRegistered(string basketId, address vault);`
- `event BasketTargetsUpdated(string basketId, address[] tokens, uint256[] targetWeightsBps);`
- `event BasketStatusUpdated(string basketId, bool active);`

These events will later be consumed by The Graph or a custom indexer.

## 10. Testing Requirements (High-Level)

Using Foundry:

**BasketVault Tests**

- `testDepositAndMintShares()`
- `testWithdrawAndRedeemShares()`
- `testPausePreventsDepositAndWithdraw()`
- `testUnpauseRestoresDepositAndWithdraw()`
- `testTotalAssetsMatchesUSDCBalance()`

**BasketRegistry Tests**

- `testRegisterBasket()` (happy path)
- `testRegisterBasketRejectsDuplicateId()`
- `testUpdateBasketTargetsValidatesWeights()`
- `testSetBasketActiveTogglesStatus()`
- `testGetBasketByIdReturnsCorrectData()`

**Access Control**

- Non-owner calls to admin functions should revert.

The initial implementation can be quite minimal; tests can be expanded over time.

## 11. Implementation Notes for AI Tools (Cursor / Composer)

When generating code from this spec:

- Do not implement complex DEX integration or real rebalancing logic in Phase 1.

- Start with:

  - A basic `BasketVault` that:
    - inherits `ERC4626`
    - uses USDC as the asset
    - supports pause/unpause

  - A basic `BasketRegistry` with:
    - registration
    - updates
    - lookup

- Add interfaces `IBasketVault`, `IBasketRegistry`, `IOracleAdapter` in separate files.

- Follow the style guide in `specs/style-guide.md`:
  - small functions
  - clear naming
  - no magic numbers
  - good comments

- Keep the code as simple and readable as possible.

- This is Phase 1, designed for safety and clarity, not cleverness.

**Future phases (not now):**

- Real DEX integration for rebalancing
- Strategy module / AI engine
- Rich oracles
- Upgrade/migration patterns
- Multi-chain deployments

Phase 1 contracts should be minimal, safe, and easy to evolve.
