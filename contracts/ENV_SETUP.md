# Environment Setup for Contract Deployment

## Required Environment Variables

Create a `.env` file in the `contracts/` directory with:

```bash
# Deployer private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Arbitrum Sepolia RPC URL
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc

# Arbiscan API Key for contract verification (optional)
ETHERSCAN_API_KEY=your_arbiscan_api_key
```

## Deployment Commands

### 1. Deploy Indexr Contracts (MockUSDC, Registry, Vaults)

```bash
cd contracts
source .env

forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  --verify \
  -vvvv
```

### 2. Deploy EchoPay Contract

```bash
cd echopay
source ../.env

forge script script/DeployEchoPay.s.sol:DeployEchoPay \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  --verify \
  -vvvv
```

## Getting Test ETH

1. Get Arbitrum Sepolia ETH from: https://faucet.quicknode.com/arbitrum/sepolia
2. You need ~0.01 ETH for deployment gas costs

## After Deployment

1. Copy the deployed addresses from the console output
2. Update `deployments/arbitrum-sepolia.json` with the addresses
3. Update frontend `.env.local` with the contract addresses

## Contract Verification

If verification fails during deployment, manually verify:

```bash
forge verify-contract <CONTRACT_ADDRESS> src/mocks/MockUSDC.sol:MockUSDC \
  --chain arbitrum-sepolia \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

