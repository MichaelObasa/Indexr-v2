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

- OpenZeppelin Contracts (via Foundry)

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

