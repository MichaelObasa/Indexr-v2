# Contracts

This folder contains all Solidity smart contracts for Indexr v2, including basket vaults, registry, oracle adapter, and related infrastructure deployed on Arbitrum.

## Project Structure

```
contracts/
├── src/
│   ├── vaults/
│   │   ├── BasketVault.sol      # ERC-4626 vault implementation
│   │   └── IBasketVault.sol     # Vault interface
│   ├── registry/
│   │   ├── BasketRegistry.sol    # Central basket registry
│   │   └── IBasketRegistry.sol   # Registry interface
│   └── oracles/
│       └── IOracleAdapter.sol   # Oracle price feed interface
├── test/
│   ├── BasketVault.t.sol        # Vault tests
│   └── BasketRegistry.t.sol      # Registry tests
├── script/
│   └── Deploy.s.sol             # Deployment scripts
├── foundry.toml                 # Foundry configuration
└── remappings.txt               # Import remappings
```

## Setup

This project uses [Foundry](https://book.getfoundry.sh/) for development, testing, and deployment.

### Prerequisites

- Install Foundry: `curl -L https://foundry.paradigm.xyz | bash`
- Install dependencies: `forge install`

### Dependencies

- OpenZeppelin Contracts v5.5.0
- forge-std v1.11.0

**Installation:**
```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
```

## Development Notes

### Tool Versions

- **Foundry**: 1.4.4 (Commit: 05794498bf47257b144e2e2789a1d5bf8566be0e)
- **OpenZeppelin Contracts**: v5.5.0
- **forge-std**: v1.11.0

### Recent Changes

**2025-11-20**: Fixed pause test to correctly set up mint/approve/pause flow
- Updated `testPausePreventsDepositAndWithdraw()` to properly mint USDC and approve before pausing
- Added `testPauseAfterDepositPreventsWithdraw()` to test pause behavior after deposits
- Fixed constructor signatures to match OpenZeppelin ERC4626 pattern (ERC20 name/symbol passed separately)
- Added override functions to resolve interface conflicts between ERC4626 and IBasketVault

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Deploy

Deployment scripts will be added in a future update.

## Phase 1 Scope

- ERC-4626 vaults with USDC as underlying asset
- Basic deposit/withdraw functionality
- Pause/unpause mechanisms
- Basket registry for metadata tracking
- No DEX integration or complex rebalancing yet

For full contract specifications, see `../specs/contracts-spec.md`.

